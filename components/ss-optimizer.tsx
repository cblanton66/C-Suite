"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Calculator,
  ArrowLeft,
  Printer,
  ChevronDown,
  ChevronUp,
  DollarSign,
  User,
  Users,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Full Retirement Age by birth year
const getFRA = (birthYear: number): { years: number; months: number } => {
  if (birthYear <= 1954) return { years: 66, months: 0 }
  if (birthYear === 1955) return { years: 66, months: 2 }
  if (birthYear === 1956) return { years: 66, months: 4 }
  if (birthYear === 1957) return { years: 66, months: 6 }
  if (birthYear === 1958) return { years: 66, months: 8 }
  if (birthYear === 1959) return { years: 66, months: 10 }
  return { years: 67, months: 0 } // 1960 and later
}

const getFRAInMonths = (birthYear: number): number => {
  const fra = getFRA(birthYear)
  return fra.years * 12 + fra.months
}

const getFRADecimal = (birthYear: number): number => {
  const fra = getFRA(birthYear)
  return fra.years + fra.months / 12
}

// Calculate benefit reduction for early claiming (before FRA)
const getEarlyClaimingReduction = (monthsEarly: number): number => {
  // First 36 months: 5/9 of 1% per month
  // Beyond 36 months: 5/12 of 1% per month
  let reduction = 0
  if (monthsEarly <= 36) {
    reduction = monthsEarly * (5 / 9 / 100)
  } else {
    reduction = 36 * (5 / 9 / 100) + (monthsEarly - 36) * (5 / 12 / 100)
  }
  return reduction
}

// Calculate delayed retirement credits (after FRA, up to 70)
const getDelayedCredits = (monthsDelayed: number): number => {
  // 8% per year = 2/3 of 1% per month, max 36 months (to age 70)
  const cappedMonths = Math.min(monthsDelayed, 36)
  return cappedMonths * (2 / 3 / 100)
}

// Calculate monthly benefit at a given claiming age
const calculateBenefitAtAge = (
  pia: number,
  birthYear: number,
  claimingAge: number
): number => {
  const fraMonths = getFRAInMonths(birthYear)
  const claimingMonths = claimingAge * 12

  if (claimingMonths < fraMonths) {
    // Early claiming - reduce benefit
    const monthsEarly = fraMonths - claimingMonths
    const reduction = getEarlyClaimingReduction(monthsEarly)
    return pia * (1 - reduction)
  } else if (claimingMonths > fraMonths) {
    // Delayed claiming - increase benefit
    const monthsDelayed = claimingMonths - fraMonths
    const increase = getDelayedCredits(monthsDelayed)
    return pia * (1 + increase)
  }
  return pia // Claiming at FRA
}

// Calculate spousal benefit
const calculateSpousalBenefit = (
  workerPIA: number,
  spouseBirthYear: number,
  spouseClaimingAge: number,
  spouseOwnPIA: number
): number => {
  // Spousal benefit is up to 50% of worker's PIA
  const maxSpousalBenefit = workerPIA * 0.5

  // Spouse gets the greater of their own benefit or spousal benefit
  const ownBenefit = calculateBenefitAtAge(spouseOwnPIA, spouseBirthYear, spouseClaimingAge)

  // If claiming spousal before FRA, it's reduced
  const fraMonths = getFRAInMonths(spouseBirthYear)
  const claimingMonths = spouseClaimingAge * 12

  let spousalBenefit = maxSpousalBenefit
  if (claimingMonths < fraMonths) {
    const monthsEarly = fraMonths - claimingMonths
    // Spousal benefits reduce at 25/36 of 1% for first 36 months, then 5/12 of 1%
    if (monthsEarly <= 36) {
      spousalBenefit = maxSpousalBenefit * (1 - monthsEarly * (25 / 36 / 100))
    } else {
      spousalBenefit = maxSpousalBenefit * (1 - 36 * (25 / 36 / 100) - (monthsEarly - 36) * (5 / 12 / 100))
    }
  }

  // Return the greater of own benefit or spousal benefit
  return Math.max(ownBenefit, spousalBenefit)
}

// Calculate survivor benefit
const calculateSurvivorBenefit = (
  deceasedWorkerBenefit: number,
  survivorBirthYear: number,
  survivorClaimingAge: number
): number => {
  // Survivor can receive up to 100% of deceased's benefit at survivor's FRA
  const fraDecimal = getFRADecimal(survivorBirthYear)

  if (survivorClaimingAge >= fraDecimal) {
    return deceasedWorkerBenefit
  }

  // If claiming before FRA, benefit is reduced
  // Survivor benefits can start at 60 (reduced) or FRA (full)
  const monthsBeforeFRA = (fraDecimal - survivorClaimingAge) * 12
  const reductionPerMonth = 0.285 / ((fraDecimal - 60) * 12) // ~28.5% reduction at 60
  const reduction = Math.min(monthsBeforeFRA * reductionPerMonth, 0.285)

  return deceasedWorkerBenefit * (1 - reduction)
}

// Estimate PIA from average annual earnings (simplified AIME calculation)
const estimatePIAFromEarnings = (averageAnnualEarnings: number): number => {
  // Convert to monthly (AIME)
  const aime = averageAnnualEarnings / 12

  // 2025 bend points (estimated)
  const bendPoint1 = 1174
  const bendPoint2 = 7078

  let pia = 0
  if (aime <= bendPoint1) {
    pia = aime * 0.90
  } else if (aime <= bendPoint2) {
    pia = bendPoint1 * 0.90 + (aime - bendPoint1) * 0.32
  } else {
    pia = bendPoint1 * 0.90 + (bendPoint2 - bendPoint1) * 0.32 + (aime - bendPoint2) * 0.15
  }

  return Math.round(pia)
}

// Calculate cumulative benefits at a given age
const calculateCumulativeBenefits = (
  monthlyBenefit: number,
  startAge: number,
  currentAge: number
): number => {
  if (currentAge < startAge) return 0
  const monthsReceiving = (currentAge - startAge) * 12
  return monthlyBenefit * monthsReceiving
}

// Find break-even age between two claiming strategies
const findBreakEvenAge = (
  pia: number,
  birthYear: number,
  earlyAge: number,
  laterAge: number
): number | null => {
  const earlyBenefit = calculateBenefitAtAge(pia, birthYear, earlyAge)
  const laterBenefit = calculateBenefitAtAge(pia, birthYear, laterAge)

  // Early strategy starts getting benefits sooner
  // Later strategy gets higher monthly benefit
  // Find when cumulative later catches up to cumulative early

  for (let age = laterAge; age <= 100; age += 0.1) {
    const earlyCumulative = calculateCumulativeBenefits(earlyBenefit, earlyAge, age)
    const laterCumulative = calculateCumulativeBenefits(laterBenefit, laterAge, age)

    if (laterCumulative >= earlyCumulative) {
      return Math.round(age * 10) / 10
    }
  }

  return null // Never breaks even (unlikely)
}

type MaritalStatus = 'single' | 'married'
type InputMethod = 'pia' | 'earnings'

interface SSInput {
  clientName: string
  maritalStatus: MaritalStatus
  birthYear: number
  birthMonth: number
  inputMethod: InputMethod
  pia: number
  averageEarnings: number
  lifeExpectancy: number
  claimingAge: number // Custom claiming age (62-70)
  // Public Employee (non-covered pension)
  isPublicEmployee: boolean
  publicPension: number // Monthly pension from non-SS-covered work
  pensionSurvivorPct: number // Survivor benefit percentage (0, 50, 100)
  // Spouse info (for married)
  spouseBirthYear: number
  spouseBirthMonth: number
  spouseInputMethod: InputMethod
  spousePIA: number
  spouseAverageEarnings: number
  spouseLifeExpectancy: number
  spouseClaimingAge: number // Custom claiming age for spouse
  spouseIsPublicEmployee: boolean
  spousePublicPension: number
  spousePensionSurvivorPct: number
}

interface ClaimingScenario {
  age: number
  monthlyBenefit: number
  annualBenefit: number
  breakEvenVs62: number | null
  cumulativeAtLE: number
}

interface CoupleStrategy {
  name: string
  person1Age: number
  person2Age: number
  person1Monthly: number
  person2Monthly: number
  combinedMonthly: number
  survivorBenefit: number
  lifetimeHousehold: number
}

interface YearlyScheduleRow {
  year: number
  person1Age: number | null // null if deceased
  person2Age: number | null // null if deceased or single
  person1SS: number
  person1Pension: number
  person2SS: number
  person2Pension: number
  survivorSS: number // Additional SS survivor benefit (if applicable)
  totalMonthly: number
  totalAnnual: number
  notes: string // "Both alive", "Person 1 deceased", etc.
}

interface SSResult {
  fra: { years: number; months: number }
  scenarios: ClaimingScenario[]
  optimalAge: number
  optimalMonthly: number
  optimalLifetime: number
  // For married couples
  spouseFRA?: { years: number; months: number }
  coupleStrategies?: CoupleStrategy[]
  optimalStrategy?: CoupleStrategy
  // Public Employee / GPO info
  publicEmployeeInfo?: {
    pension: number
    gpoReduction: number // What GPO would have taken (2/3 of pension)
    spousalBenefitPreGPO: number
    spousalBenefitPostGPO: number // Under old rules (likely $0)
    monthlySavings: number // What they save under new law
    annualSavings: number
  }
  spousePublicEmployeeInfo?: {
    pension: number
    gpoReduction: number
    spousalBenefitPreGPO: number
    spousalBenefitPostGPO: number
    monthlySavings: number
    annualSavings: number
  }
  // Total combined retirement income
  totalMonthlyIncome?: number
  totalAnnualIncome?: number
  // Year-by-year schedule
  yearlySchedule?: YearlyScheduleRow[]
  lifetimeTotalBenefits?: number
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatAge = (fra: { years: number; months: number }): string => {
  if (fra.months === 0) return `${fra.years}`
  return `${fra.years} and ${fra.months} months`
}

export function SSOptimizer() {
  const printRef = useRef<HTMLDivElement>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [result, setResult] = useState<SSResult | null>(null)

  const currentYear = new Date().getFullYear()

  const [input, setInput] = useState<SSInput>({
    clientName: '',
    maritalStatus: 'single',
    birthYear: 1960,
    birthMonth: 1,
    inputMethod: 'pia',
    pia: 0,
    averageEarnings: 0,
    lifeExpectancy: 85,
    claimingAge: 67,
    isPublicEmployee: false,
    publicPension: 0,
    pensionSurvivorPct: 50,
    spouseBirthYear: 1960,
    spouseBirthMonth: 1,
    spouseInputMethod: 'pia',
    spousePIA: 0,
    spouseAverageEarnings: 0,
    spouseLifeExpectancy: 85,
    spouseClaimingAge: 67,
    spouseIsPublicEmployee: false,
    spousePublicPension: 0,
    spousePensionSurvivorPct: 50
  })

  const handleInputChange = (field: keyof SSInput, value: string | number | boolean) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const handleNumberInput = (field: keyof SSInput, value: string) => {
    const num = parseFloat(value.replace(/,/g, '')) || 0
    handleInputChange(field, num)
  }

  const calculateOptimal = () => {
    // Get PIA (either direct or estimated)
    const pia = input.inputMethod === 'pia'
      ? input.pia
      : estimatePIAFromEarnings(input.averageEarnings)

    if (pia <= 0) {
      toast.error("Please enter a valid PIA or earnings amount")
      return
    }

    const fra = getFRA(input.birthYear)
    const fraDecimal = getFRADecimal(input.birthYear)

    // Calculate scenarios for ages 62-70
    const scenarios: ClaimingScenario[] = []
    let optimalAge = 62
    let optimalLifetime = 0

    for (let age = 62; age <= 70; age++) {
      const monthlyBenefit = calculateBenefitAtAge(pia, input.birthYear, age)
      const annualBenefit = monthlyBenefit * 12
      const yearsReceiving = input.lifeExpectancy - age
      const cumulativeAtLE = monthlyBenefit * 12 * yearsReceiving
      const breakEvenVs62 = age === 62 ? null : findBreakEvenAge(pia, input.birthYear, 62, age)

      scenarios.push({
        age,
        monthlyBenefit: Math.round(monthlyBenefit),
        annualBenefit: Math.round(annualBenefit),
        breakEvenVs62,
        cumulativeAtLE: Math.round(cumulativeAtLE)
      })

      if (cumulativeAtLE > optimalLifetime) {
        optimalLifetime = cumulativeAtLE
        optimalAge = age
      }
    }

    const optimalMonthly = calculateBenefitAtAge(pia, input.birthYear, optimalAge)

    // For married couples, calculate strategies
    let spouseFRA, coupleStrategies, optimalStrategy

    if (input.maritalStatus === 'married') {
      const spousePIA = input.spouseInputMethod === 'pia'
        ? input.spousePIA
        : estimatePIAFromEarnings(input.spouseAverageEarnings)

      spouseFRA = getFRA(input.spouseBirthYear)

      // Determine higher and lower earner
      const person1PIA = pia
      const person2PIA = spousePIA
      const person1BY = input.birthYear
      const person2BY = input.spouseBirthYear
      const person1LE = input.lifeExpectancy
      const person2LE = input.spouseLifeExpectancy

      // Calculate different strategies
      const strategies: CoupleStrategy[] = []

      const strategyConfigs = [
        { name: "Both at 62", p1Age: 62, p2Age: 62 },
        { name: "Both at FRA", p1Age: Math.ceil(getFRADecimal(person1BY)), p2Age: Math.ceil(getFRADecimal(person2BY)) },
        { name: "Both at 70", p1Age: 70, p2Age: 70 },
        { name: "Higher earner 70, Lower 62", p1Age: person1PIA >= person2PIA ? 70 : 62, p2Age: person1PIA >= person2PIA ? 62 : 70 },
        { name: "Higher earner 70, Lower FRA", p1Age: person1PIA >= person2PIA ? 70 : Math.ceil(getFRADecimal(person1BY)), p2Age: person1PIA >= person2PIA ? Math.ceil(getFRADecimal(person2BY)) : 70 },
      ]

      for (const config of strategyConfigs) {
        const p1Monthly = calculateBenefitAtAge(person1PIA, person1BY, config.p1Age)
        const p2Monthly = calculateBenefitAtAge(person2PIA, person2BY, config.p2Age)

        // Spousal benefit consideration (simplified - takes greater of own or spousal)
        const p1WithSpousal = Math.max(p1Monthly, person2PIA * 0.5)
        const p2WithSpousal = Math.max(p2Monthly, person1PIA * 0.5)

        const combinedMonthly = p1Monthly + p2WithSpousal

        // Survivor benefit (higher of the two benefits)
        const survivorBenefit = Math.max(p1Monthly, p2Monthly)

        // Estimate lifetime household benefit (simplified)
        // Assume both alive until earlier LE, then survivor until later LE
        const earlierLE = Math.min(person1LE, person2LE)
        const laterLE = Math.max(person1LE, person2LE)
        const startAge = Math.max(config.p1Age, config.p2Age)

        const bothAliveYears = Math.max(0, earlierLE - startAge)
        const survivorYears = laterLE - earlierLE

        const lifetimeHousehold =
          (combinedMonthly * 12 * bothAliveYears) +
          (survivorBenefit * 12 * survivorYears)

        strategies.push({
          name: config.name,
          person1Age: config.p1Age,
          person2Age: config.p2Age,
          person1Monthly: Math.round(p1Monthly),
          person2Monthly: Math.round(p2WithSpousal),
          combinedMonthly: Math.round(combinedMonthly),
          survivorBenefit: Math.round(survivorBenefit),
          lifetimeHousehold: Math.round(lifetimeHousehold)
        })
      }

      coupleStrategies = strategies
      optimalStrategy = strategies.reduce((best, current) =>
        current.lifetimeHousehold > best.lifetimeHousehold ? current : best
      )
    }

    // Calculate Public Employee / GPO info
    let publicEmployeeInfo, spousePublicEmployeeInfo, totalMonthlyIncome, totalAnnualIncome

    // For person 1 (if public employee receiving spousal benefit)
    if (input.isPublicEmployee && input.publicPension > 0 && input.maritalStatus === 'married') {
      const spousePIA = input.spouseInputMethod === 'pia'
        ? input.spousePIA
        : estimatePIAFromEarnings(input.spouseAverageEarnings)
      const spousalBenefitPreGPO = spousePIA * 0.5 // 50% of spouse's PIA
      const gpoReduction = input.publicPension * (2 / 3) // Old GPO was 2/3 of pension
      const spousalBenefitPostGPO = Math.max(0, spousalBenefitPreGPO - gpoReduction)
      const monthlySavings = spousalBenefitPreGPO - spousalBenefitPostGPO

      publicEmployeeInfo = {
        pension: input.publicPension,
        gpoReduction: Math.round(gpoReduction),
        spousalBenefitPreGPO: Math.round(spousalBenefitPreGPO),
        spousalBenefitPostGPO: Math.round(spousalBenefitPostGPO),
        monthlySavings: Math.round(monthlySavings),
        annualSavings: Math.round(monthlySavings * 12)
      }
    }

    // For spouse (if public employee receiving spousal benefit)
    if (input.spouseIsPublicEmployee && input.spousePublicPension > 0 && input.maritalStatus === 'married') {
      const spousalBenefitPreGPO = pia * 0.5 // 50% of person 1's PIA
      const gpoReduction = input.spousePublicPension * (2 / 3)
      const spousalBenefitPostGPO = Math.max(0, spousalBenefitPreGPO - gpoReduction)
      const monthlySavings = spousalBenefitPreGPO - spousalBenefitPostGPO

      spousePublicEmployeeInfo = {
        pension: input.spousePublicPension,
        gpoReduction: Math.round(gpoReduction),
        spousalBenefitPreGPO: Math.round(spousalBenefitPreGPO),
        spousalBenefitPostGPO: Math.round(spousalBenefitPostGPO),
        monthlySavings: Math.round(monthlySavings),
        annualSavings: Math.round(monthlySavings * 12)
      }
    }

    // Calculate total combined income (for married couples with public pensions)
    if (input.maritalStatus === 'married') {
      const person1SS = calculateBenefitAtAge(pia, input.birthYear, input.claimingAge)
      const spousePIA = input.spouseInputMethod === 'pia'
        ? input.spousePIA
        : estimatePIAFromEarnings(input.spouseAverageEarnings)
      const spouseSS = calculateBenefitAtAge(spousePIA, input.spouseBirthYear, input.spouseClaimingAge)

      const person1Pension = input.isPublicEmployee ? input.publicPension : 0
      const spousePension = input.spouseIsPublicEmployee ? input.spousePublicPension : 0

      // Under new law, they get full SS benefits + pensions
      totalMonthlyIncome = person1SS + spouseSS + person1Pension + spousePension
      totalAnnualIncome = totalMonthlyIncome * 12
    }

    // Generate Year-by-Year Schedule
    const yearlySchedule: YearlyScheduleRow[] = []
    let lifetimeTotalBenefits = 0

    const person1BenefitAtClaiming = calculateBenefitAtAge(pia, input.birthYear, input.claimingAge)
    const person1Pension = input.isPublicEmployee ? input.publicPension : 0

    if (input.maritalStatus === 'single') {
      // Single person schedule
      const startYear = input.birthYear + input.claimingAge
      const endYear = input.birthYear + input.lifeExpectancy

      for (let year = startYear; year <= endYear; year++) {
        const age = year - input.birthYear
        const totalMonthly = person1BenefitAtClaiming + person1Pension
        const totalAnnual = totalMonthly * 12
        lifetimeTotalBenefits += totalAnnual

        yearlySchedule.push({
          year,
          person1Age: age,
          person2Age: null,
          person1SS: Math.round(person1BenefitAtClaiming),
          person1Pension: Math.round(person1Pension),
          person2SS: 0,
          person2Pension: 0,
          survivorSS: 0,
          totalMonthly: Math.round(totalMonthly),
          totalAnnual: Math.round(totalAnnual),
          notes: ''
        })
      }
    } else {
      // Married couple schedule
      const spousePIA = input.spouseInputMethod === 'pia'
        ? input.spousePIA
        : estimatePIAFromEarnings(input.spouseAverageEarnings)
      const person2BenefitAtClaiming = calculateBenefitAtAge(spousePIA, input.spouseBirthYear, input.spouseClaimingAge)
      const person2Pension = input.spouseIsPublicEmployee ? input.spousePublicPension : 0

      // Determine years and death order
      const person1DeathYear = input.birthYear + input.lifeExpectancy
      const person2DeathYear = input.spouseBirthYear + input.spouseLifeExpectancy
      const person1ClaimYear = input.birthYear + input.claimingAge
      const person2ClaimYear = input.spouseBirthYear + input.spouseClaimingAge

      const startYear = Math.min(person1ClaimYear, person2ClaimYear)
      const endYear = Math.max(person1DeathYear, person2DeathYear)

      // Survivor SS benefit is the higher of the two
      const survivorSSBenefit = Math.max(person1BenefitAtClaiming, person2BenefitAtClaiming)

      for (let year = startYear; year <= endYear; year++) {
        const person1Age = year - input.birthYear
        const person2Age = year - input.spouseBirthYear
        const person1Alive = year <= person1DeathYear
        const person2Alive = year <= person2DeathYear
        const person1Claiming = year >= person1ClaimYear
        const person2Claiming = year >= person2ClaimYear

        let p1SS = 0, p1Pen = 0, p2SS = 0, p2Pen = 0, survSS = 0
        let notes = ''

        if (person1Alive && person2Alive) {
          // Both alive
          p1SS = person1Claiming ? person1BenefitAtClaiming : 0
          p1Pen = person1Pension
          p2SS = person2Claiming ? person2BenefitAtClaiming : 0
          p2Pen = person2Pension
          notes = 'Both receiving benefits'
          if (!person1Claiming && !person2Claiming) notes = 'Pre-retirement'
          else if (!person1Claiming) notes = 'Spouse receiving, you not yet'
          else if (!person2Claiming) notes = 'You receiving, spouse not yet'
        } else if (person1Alive && !person2Alive) {
          // Person 1 is survivor
          p1SS = person1Claiming ? person1BenefitAtClaiming : 0
          p1Pen = person1Pension
          // Survivor gets the higher SS benefit
          if (person2BenefitAtClaiming > person1BenefitAtClaiming) {
            survSS = person2BenefitAtClaiming - (person1Claiming ? person1BenefitAtClaiming : 0)
            if (survSS < 0) survSS = 0
            p1SS = person2BenefitAtClaiming // Replace with survivor benefit
            survSS = 0 // Already included in p1SS
          }
          // Pension survivor benefit
          p2Pen = person2Pension * (input.spousePensionSurvivorPct / 100)
          notes = `Spouse deceased (Age ${input.spouseLifeExpectancy}) - Survivor benefits`
        } else if (!person1Alive && person2Alive) {
          // Person 2 is survivor
          p2SS = person2Claiming ? person2BenefitAtClaiming : 0
          p2Pen = person2Pension
          // Survivor gets the higher SS benefit
          if (person1BenefitAtClaiming > person2BenefitAtClaiming) {
            p2SS = person1BenefitAtClaiming // Replace with survivor benefit
          }
          // Pension survivor benefit
          p1Pen = person1Pension * (input.pensionSurvivorPct / 100)
          notes = `You deceased (Age ${input.lifeExpectancy}) - Survivor benefits`
        } else {
          // Both deceased - skip
          continue
        }

        const totalMonthly = p1SS + p1Pen + p2SS + p2Pen + survSS
        const totalAnnual = totalMonthly * 12
        lifetimeTotalBenefits += totalAnnual

        yearlySchedule.push({
          year,
          person1Age: person1Alive ? person1Age : null,
          person2Age: person2Alive ? person2Age : null,
          person1SS: Math.round(p1SS),
          person1Pension: Math.round(p1Pen),
          person2SS: Math.round(p2SS),
          person2Pension: Math.round(p2Pen),
          survivorSS: Math.round(survSS),
          totalMonthly: Math.round(totalMonthly),
          totalAnnual: Math.round(totalAnnual),
          notes
        })
      }
    }

    setResult({
      fra,
      scenarios,
      optimalAge,
      optimalMonthly: Math.round(optimalMonthly),
      optimalLifetime: Math.round(optimalLifetime),
      spouseFRA,
      coupleStrategies,
      optimalStrategy,
      publicEmployeeInfo,
      spousePublicEmployeeInfo,
      totalMonthlyIncome: totalMonthlyIncome ? Math.round(totalMonthlyIncome) : undefined,
      totalAnnualIncome: totalAnnualIncome ? Math.round(totalAnnualIncome) : undefined,
      yearlySchedule,
      lifetimeTotalBenefits: Math.round(lifetimeTotalBenefits)
    })

    toast.success("Analysis complete!")
  }

  const handlePrint = () => {
    window.print()
  }

  const clearForm = () => {
    setInput({
      clientName: '',
      maritalStatus: 'single',
      birthYear: 1960,
      birthMonth: 1,
      inputMethod: 'pia',
      pia: 0,
      averageEarnings: 0,
      lifeExpectancy: 85,
      claimingAge: 67,
      isPublicEmployee: false,
      publicPension: 0,
      pensionSurvivorPct: 50,
      spouseBirthYear: 1960,
      spouseBirthMonth: 1,
      spouseInputMethod: 'pia',
      spousePIA: 0,
      spouseAverageEarnings: 0,
      spouseLifeExpectancy: 85,
      spouseClaimingAge: 67,
      spouseIsPublicEmployee: false,
      spousePublicPension: 0,
      spousePensionSurvivorPct: 50
    })
    setResult(null)
    toast.info("Form cleared")
  }

  const currentAge = currentYear - input.birthYear

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/assistant">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Social Security Optimizer</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8" ref={printRef}>
        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">Social Security Claiming Analysis</h1>
          {input.clientName && <p className="text-center text-lg mt-2">Client: {input.clientName}</p>}
          <p className="text-center text-sm text-muted-foreground mt-1">
            Prepared on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6 print:hidden">
            {/* Client Info */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Client Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <Input
                    placeholder="Enter client name"
                    value={input.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marital Status</label>
                  <Select
                    value={input.maritalStatus}
                    onValueChange={(v) => handleInputChange('maritalStatus', v as MaritalStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Birth Year</label>
                    <Input
                      type="number"
                      min="1940"
                      max={currentYear - 50}
                      value={input.birthYear}
                      onChange={(e) => handleInputChange('birthYear', parseInt(e.target.value) || 1960)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Birth Month</label>
                    <Select
                      value={input.birthMonth.toString()}
                      onValueChange={(v) => handleInputChange('birthMonth', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Life Expectancy (Age)
                    </label>
                    <Input
                      type="number"
                      min="70"
                      max="100"
                      value={input.lifeExpectancy}
                      onChange={(e) => handleInputChange('lifeExpectancy', parseInt(e.target.value) || 85)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      SS Claiming Age
                    </label>
                    <Select
                      value={input.claimingAge.toString()}
                      onValueChange={(v) => handleInputChange('claimingAge', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[62, 63, 64, 65, 66, 67, 68, 69, 70].map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}{age === Math.ceil(getFRADecimal(input.birthYear)) ? ' (FRA)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current age: {currentAge} | FRA: {formatAge(getFRA(input.birthYear))}
                </p>
              </div>
            </Card>

            {/* Benefit Input */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Your Benefit Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Input Method</label>
                  <Select
                    value={input.inputMethod}
                    onValueChange={(v) => handleInputChange('inputMethod', v as InputMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pia">Enter PIA directly (from SSA statement)</SelectItem>
                      <SelectItem value="earnings">Estimate from average earnings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {input.inputMethod === 'pia' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Primary Insurance Amount (PIA) at Full Retirement Age
                    </label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={input.pia ? input.pia.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('pia', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Find this on your Social Security statement at ssa.gov/myaccount
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Average Annual Earnings (Career Average)
                    </label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={input.averageEarnings ? input.averageEarnings.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('averageEarnings', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated PIA: {formatCurrency(estimatePIAFromEarnings(input.averageEarnings))}/month
                    </p>
                  </div>
                )}

                {/* Public Employee Pension */}
                {input.maritalStatus === 'married' && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="isPublicEmployee"
                        checked={input.isPublicEmployee}
                        onChange={(e) => handleInputChange('isPublicEmployee', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="isPublicEmployee" className="text-sm font-medium cursor-pointer">
                        Public Employee (Teacher, Police, etc.)
                      </label>
                    </div>
                    {input.isPublicEmployee && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Monthly Pension from Non-Covered Work
                          </label>
                          <Input
                            type="text"
                            placeholder="0"
                            value={input.publicPension ? input.publicPension.toLocaleString() : ''}
                            onChange={(e) => handleNumberInput('publicPension', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter pension from work NOT covered by Social Security (e.g., teacher retirement)
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Pension Survivor Benefit %
                          </label>
                          <Select
                            value={input.pensionSurvivorPct.toString()}
                            onValueChange={(v) => handleInputChange('pensionSurvivorPct', parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0% (Single Life)</SelectItem>
                              <SelectItem value="50">50% Joint & Survivor</SelectItem>
                              <SelectItem value="75">75% Joint & Survivor</SelectItem>
                              <SelectItem value="100">100% Joint & Survivor</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            What % of pension continues to spouse after death?
                          </p>
                        </div>
                        <p className="text-xs text-green-600">
                          SS Fairness Act (Jan 2025) eliminated GPO - full SS spousal benefits now available!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Spouse Info (for married) */}
            {input.maritalStatus === 'married' && (
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Spouse Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Spouse Birth Year</label>
                      <Input
                        type="number"
                        min="1940"
                        max={currentYear - 50}
                        value={input.spouseBirthYear}
                        onChange={(e) => handleInputChange('spouseBirthYear', parseInt(e.target.value) || 1960)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Spouse Birth Month</label>
                      <Select
                        value={input.spouseBirthMonth.toString()}
                        onValueChange={(v) => handleInputChange('spouseBirthMonth', parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Life Expectancy</label>
                      <Input
                        type="number"
                        min="70"
                        max="100"
                        value={input.spouseLifeExpectancy}
                        onChange={(e) => handleInputChange('spouseLifeExpectancy', parseInt(e.target.value) || 85)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SS Claiming Age</label>
                      <Select
                        value={input.spouseClaimingAge.toString()}
                        onValueChange={(v) => handleInputChange('spouseClaimingAge', parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[62, 63, 64, 65, 66, 67, 68, 69, 70].map((age) => (
                            <SelectItem key={age} value={age.toString()}>
                              {age}{age === Math.ceil(getFRADecimal(input.spouseBirthYear)) ? ' (FRA)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Spouse FRA: {formatAge(getFRA(input.spouseBirthYear))}
                  </p>

                  <div>
                    <label className="block text-sm font-medium mb-1">Spouse Benefit Input Method</label>
                    <Select
                      value={input.spouseInputMethod}
                      onValueChange={(v) => handleInputChange('spouseInputMethod', v as InputMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pia">Enter PIA directly</SelectItem>
                        <SelectItem value="earnings">Estimate from earnings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {input.spouseInputMethod === 'pia' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Spouse PIA at FRA</label>
                      <Input
                        type="text"
                        placeholder="0"
                        value={input.spousePIA ? input.spousePIA.toLocaleString() : ''}
                        onChange={(e) => handleNumberInput('spousePIA', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">Spouse Average Annual Earnings</label>
                      <Input
                        type="text"
                        placeholder="0"
                        value={input.spouseAverageEarnings ? input.spouseAverageEarnings.toLocaleString() : ''}
                        onChange={(e) => handleNumberInput('spouseAverageEarnings', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated PIA: {formatCurrency(estimatePIAFromEarnings(input.spouseAverageEarnings))}/month
                      </p>
                    </div>
                  )}

                  {/* Spouse Public Employee Pension */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="spouseIsPublicEmployee"
                        checked={input.spouseIsPublicEmployee}
                        onChange={(e) => handleInputChange('spouseIsPublicEmployee', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="spouseIsPublicEmployee" className="text-sm font-medium cursor-pointer">
                        Spouse is Public Employee (Teacher, Police, etc.)
                      </label>
                    </div>
                    {input.spouseIsPublicEmployee && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Spouse Monthly Pension from Non-Covered Work
                          </label>
                          <Input
                            type="text"
                            placeholder="0"
                            value={input.spousePublicPension ? input.spousePublicPension.toLocaleString() : ''}
                            onChange={(e) => handleNumberInput('spousePublicPension', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter pension from work NOT covered by Social Security (e.g., teacher retirement)
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Pension Survivor Benefit %
                          </label>
                          <Select
                            value={input.spousePensionSurvivorPct.toString()}
                            onValueChange={(v) => handleInputChange('spousePensionSurvivorPct', parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0% (Single Life)</SelectItem>
                              <SelectItem value="50">50% Joint & Survivor</SelectItem>
                              <SelectItem value="75">75% Joint & Survivor</SelectItem>
                              <SelectItem value="100">100% Joint & Survivor</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            What % of pension continues to you after spouse&apos;s death?
                          </p>
                        </div>
                        <p className="text-xs text-green-600">
                          SS Fairness Act (Jan 2025) eliminated GPO - full SS spousal benefits now available!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={calculateOptimal} className="flex-1">
                <Calculator className="w-4 h-4 mr-2" />
                Analyze Claiming Strategies
              </Button>
              <Button variant="outline" onClick={clearForm}>
                Clear
              </Button>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Recommendation Card */}
                <Card className="p-4 border-primary border-2">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {input.maritalStatus === 'married' ? 'Recommended Strategy' : 'Optimal Claiming Age'}
                  </h2>

                  {input.maritalStatus === 'single' ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-primary">Age {result.optimalAge}</p>
                        <p className="text-muted-foreground">Based on life expectancy of {input.lifeExpectancy}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Monthly Benefit</p>
                          <p className="text-xl font-semibold">{formatCurrency(result.optimalMonthly)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Lifetime Total</p>
                          <p className="text-xl font-semibold">{formatCurrency(result.optimalLifetime)}</p>
                        </div>
                      </div>
                    </div>
                  ) : result.optimalStrategy && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{result.optimalStrategy.name}</p>
                        <p className="text-muted-foreground">
                          You: Age {result.optimalStrategy.person1Age} | Spouse: Age {result.optimalStrategy.person2Age}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Combined Monthly</p>
                          <p className="text-lg font-semibold">{formatCurrency(result.optimalStrategy.combinedMonthly)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Survivor Benefit</p>
                          <p className="text-lg font-semibold">{formatCurrency(result.optimalStrategy.survivorBenefit)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Lifetime Total</p>
                          <p className="text-lg font-semibold">{formatCurrency(result.optimalStrategy.lifetimeHousehold)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Break-Even Analysis */}
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Break-Even Analysis (Individual)
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your FRA: {formatAge(result.fra)}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Claiming Age</th>
                          <th className="text-right py-2">Monthly</th>
                          <th className="text-right py-2">Break-even vs 62</th>
                          <th className="text-right py-2">Cumulative at {input.lifeExpectancy}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.scenarios.map((scenario) => (
                          <tr
                            key={scenario.age}
                            className={`border-b ${scenario.age === result.optimalAge ? 'bg-primary/10 font-semibold' : ''}`}
                          >
                            <td className="py-2">
                              {scenario.age}
                              {scenario.age === Math.ceil(getFRADecimal(input.birthYear)) && ' (FRA)'}
                              {scenario.age === result.optimalAge && ' *'}
                            </td>
                            <td className="text-right py-2">{formatCurrency(scenario.monthlyBenefit)}</td>
                            <td className="text-right py-2">
                              {scenario.breakEvenVs62 ? `Age ${scenario.breakEvenVs62}` : '-'}
                            </td>
                            <td className="text-right py-2">{formatCurrency(scenario.cumulativeAtLE)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">* Optimal based on life expectancy</p>
                </Card>

                {/* Couple Strategy Comparison */}
                {input.maritalStatus === 'married' && result.coupleStrategies && (
                  <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Couple Strategy Comparison
                    </h2>
                    {result.spouseFRA && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Spouse FRA: {formatAge(result.spouseFRA)}
                      </p>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Strategy</th>
                            <th className="text-right py-2">Combined/mo</th>
                            <th className="text-right py-2">Survivor</th>
                            <th className="text-right py-2">Lifetime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.coupleStrategies.map((strategy) => (
                            <tr
                              key={strategy.name}
                              className={`border-b ${strategy.name === result.optimalStrategy?.name ? 'bg-primary/10 font-semibold' : ''}`}
                            >
                              <td className="py-2">
                                {strategy.name}
                                {strategy.name === result.optimalStrategy?.name && ' *'}
                              </td>
                              <td className="text-right py-2">{formatCurrency(strategy.combinedMonthly)}</td>
                              <td className="text-right py-2">{formatCurrency(strategy.survivorBenefit)}</td>
                              <td className="text-right py-2">{formatCurrency(strategy.lifetimeHousehold)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">* Optimal based on combined life expectancy</p>
                  </Card>
                )}

                {/* Public Employee / GPO Savings Card */}
                {(result.publicEmployeeInfo || result.spousePublicEmployeeInfo) && (
                  <Card className="p-4 border-green-500 border-2">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Award className="w-5 h-5" />
                      SS Fairness Act Benefit (GPO Eliminated)
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      The Social Security Fairness Act (signed January 2025) eliminated the Government Pension Offset.
                      Here&apos;s what you now receive that would have been reduced or eliminated under the old rules:
                    </p>

                    {result.publicEmployeeInfo && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h3 className="font-medium mb-2">Your Benefits</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Public Pension</p>
                            <p className="font-semibold">{formatCurrency(result.publicEmployeeInfo.pension)}/mo</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Full SS Spousal Benefit</p>
                            <p className="font-semibold text-green-600">{formatCurrency(result.publicEmployeeInfo.spousalBenefitPreGPO)}/mo</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Old GPO Would Have Reduced By</p>
                            <p className="font-semibold text-red-500 line-through">{formatCurrency(result.publicEmployeeInfo.gpoReduction)}/mo</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Under Old Rules You&apos;d Get</p>
                            <p className="font-semibold text-red-500">{formatCurrency(result.publicEmployeeInfo.spousalBenefitPostGPO)}/mo</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                          <p className="text-green-700 dark:text-green-400 font-semibold">
                            You SAVE {formatCurrency(result.publicEmployeeInfo.monthlySavings)}/month ({formatCurrency(result.publicEmployeeInfo.annualSavings)}/year) under the new law!
                          </p>
                        </div>
                      </div>
                    )}

                    {result.spousePublicEmployeeInfo && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h3 className="font-medium mb-2">Spouse Benefits</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Spouse Public Pension</p>
                            <p className="font-semibold">{formatCurrency(result.spousePublicEmployeeInfo.pension)}/mo</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Full SS Spousal Benefit</p>
                            <p className="font-semibold text-green-600">{formatCurrency(result.spousePublicEmployeeInfo.spousalBenefitPreGPO)}/mo</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Old GPO Would Have Reduced By</p>
                            <p className="font-semibold text-red-500 line-through">{formatCurrency(result.spousePublicEmployeeInfo.gpoReduction)}/mo</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Under Old Rules Spouse&apos;d Get</p>
                            <p className="font-semibold text-red-500">{formatCurrency(result.spousePublicEmployeeInfo.spousalBenefitPostGPO)}/mo</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                          <p className="text-green-700 dark:text-green-400 font-semibold">
                            Spouse SAVES {formatCurrency(result.spousePublicEmployeeInfo.monthlySavings)}/month ({formatCurrency(result.spousePublicEmployeeInfo.annualSavings)}/year) under the new law!
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Total Combined Retirement Income */}
                {result.totalMonthlyIncome && (input.isPublicEmployee || input.spouseIsPublicEmployee) && (
                  <Card className="p-4 bg-primary/5">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Total Combined Retirement Income
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(result.totalMonthlyIncome)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          (SS benefits + public pensions)
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Annual Income</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(result.totalAnnualIncome || 0)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t text-sm">
                      <p className="font-medium mb-2">Breakdown:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Your SS Benefit</span>
                          <span>{formatCurrency(result.optimalMonthly)}/mo</span>
                        </div>
                        {input.isPublicEmployee && (
                          <div className="flex justify-between">
                            <span>Your Public Pension</span>
                            <span>{formatCurrency(input.publicPension)}/mo</span>
                          </div>
                        )}
                        {input.maritalStatus === 'married' && (
                          <>
                            <div className="flex justify-between">
                              <span>Spouse SS Benefit</span>
                              <span>{formatCurrency((result.totalMonthlyIncome || 0) - result.optimalMonthly - (input.isPublicEmployee ? input.publicPension : 0) - (input.spouseIsPublicEmployee ? input.spousePublicPension : 0))}/mo</span>
                            </div>
                            {input.spouseIsPublicEmployee && (
                              <div className="flex justify-between">
                                <span>Spouse Public Pension</span>
                                <span>{formatCurrency(input.spousePublicPension)}/mo</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Year-by-Year Retirement Income Schedule */}
                {result.yearlySchedule && result.yearlySchedule.length > 0 && (
                  <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Year-by-Year Retirement Income Schedule
                    </h2>
                    <p className="text-sm text-muted-foreground mb-3">
                      Based on claiming ages: You at {input.claimingAge}
                      {input.maritalStatus === 'married' && `, Spouse at ${input.spouseClaimingAge}`}
                    </p>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b">
                            <th className="text-left py-2 px-1">Year</th>
                            <th className="text-center py-2 px-1">Your Age</th>
                            {input.maritalStatus === 'married' && (
                              <th className="text-center py-2 px-1">Spouse Age</th>
                            )}
                            <th className="text-right py-2 px-1">Your SS</th>
                            {input.isPublicEmployee && (
                              <th className="text-right py-2 px-1">Your Pension</th>
                            )}
                            {input.maritalStatus === 'married' && (
                              <th className="text-right py-2 px-1">Spouse SS</th>
                            )}
                            {input.spouseIsPublicEmployee && (
                              <th className="text-right py-2 px-1">Spouse Pension</th>
                            )}
                            <th className="text-right py-2 px-1 font-bold">Annual Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.yearlySchedule.map((row, idx) => {
                            const isFirstDeathYear = idx > 0 && row.notes.includes('deceased') && !result.yearlySchedule![idx - 1].notes.includes('deceased')
                            return (
                              <tr
                                key={row.year}
                                className={`border-b ${isFirstDeathYear ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                              >
                                <td className="py-1 px-1">{row.year}</td>
                                <td className="text-center py-1 px-1">
                                  {row.person1Age !== null ? row.person1Age : '-'}
                                </td>
                                {input.maritalStatus === 'married' && (
                                  <td className="text-center py-1 px-1">
                                    {row.person2Age !== null ? row.person2Age : '-'}
                                  </td>
                                )}
                                <td className="text-right py-1 px-1">{formatCurrency(row.person1SS)}</td>
                                {input.isPublicEmployee && (
                                  <td className="text-right py-1 px-1">{formatCurrency(row.person1Pension)}</td>
                                )}
                                {input.maritalStatus === 'married' && (
                                  <td className="text-right py-1 px-1">{formatCurrency(row.person2SS)}</td>
                                )}
                                {input.spouseIsPublicEmployee && (
                                  <td className="text-right py-1 px-1">{formatCurrency(row.person2Pension)}</td>
                                )}
                                <td className="text-right py-1 px-1 font-semibold">{formatCurrency(row.totalAnnual)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot className="border-t-2 bg-primary/5">
                          <tr>
                            <td colSpan={input.maritalStatus === 'married' ? 3 : 2} className="py-2 px-1 font-bold">
                              Lifetime Total
                            </td>
                            {input.isPublicEmployee && <td></td>}
                            {input.maritalStatus === 'married' && <td></td>}
                            {input.spouseIsPublicEmployee && <td></td>}
                            <td className="text-right py-2 px-1 font-bold text-lg text-primary">
                              {formatCurrency(result.lifetimeTotalBenefits || 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {input.maritalStatus === 'married' && (
                      <p className="text-xs text-muted-foreground mt-3">
                        * After a spouse passes, survivor receives the higher SS benefit + any pension survivor benefits elected
                      </p>
                    )}
                  </Card>
                )}

                {/* Cumulative Benefits Chart */}
                <Card className="p-4">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between text-lg font-semibold print:hidden"
                  >
                    <span>Cumulative Benefits Over Time</span>
                    {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <h2 className="text-lg font-semibold hidden print:block mb-4">Cumulative Benefits Over Time</h2>

                  {(showDetails || true) && (
                    <div className={`mt-4 ${!showDetails ? 'hidden print:block' : ''}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Age</th>
                              <th className="text-right py-2">Claim 62</th>
                              <th className="text-right py-2">Claim FRA</th>
                              <th className="text-right py-2">Claim 70</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[70, 75, 80, 85, 90, 95].map((age) => {
                              const pia = input.inputMethod === 'pia' ? input.pia : estimatePIAFromEarnings(input.averageEarnings)
                              const benefit62 = calculateBenefitAtAge(pia, input.birthYear, 62)
                              const fraAge = Math.ceil(getFRADecimal(input.birthYear))
                              const benefitFRA = calculateBenefitAtAge(pia, input.birthYear, fraAge)
                              const benefit70 = calculateBenefitAtAge(pia, input.birthYear, 70)

                              return (
                                <tr key={age} className="border-b">
                                  <td className="py-2">{age}</td>
                                  <td className="text-right py-2">
                                    {formatCurrency(calculateCumulativeBenefits(benefit62, 62, age))}
                                  </td>
                                  <td className="text-right py-2">
                                    {formatCurrency(calculateCumulativeBenefits(benefitFRA, fraAge, age))}
                                  </td>
                                  <td className="text-right py-2">
                                    {formatCurrency(calculateCumulativeBenefits(benefit70, 70, age))}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center">
                  This is an estimate for planning purposes only. Actual benefits depend on your complete
                  earnings history and current SSA rules. Consult ssa.gov for official benefit calculations.
                </p>
              </>
            ) : (
              <Card className="p-8 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Enter Information to Analyze</h3>
                <p className="text-muted-foreground">
                  Fill in your information on the left, then click "Analyze Claiming Strategies"
                  to see the optimal time to begin receiving Social Security benefits.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
