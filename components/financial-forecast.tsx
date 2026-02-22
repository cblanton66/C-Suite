"use client"

import { useState, useRef, useMemo } from "react"
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
  TrendingUp,
  Plus,
  Trash2,
  AlertCircle,
  Wallet,
  PiggyBank,
  LineChart,
  BarChart3,
  Download
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Tax brackets for projections (simplified - using 2025 MFJ as baseline, inflated each year)
const TAX_BRACKETS_2025_MFJ = [
  { min: 0, max: 23850, rate: 0.10 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 }
]

const TAX_BRACKETS_2025_SINGLE = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 }
]

const STANDARD_DEDUCTION_2025 = { single: 15750, mfj: 31500 }

const CAP_GAINS_BRACKETS_2025_MFJ = [
  { min: 0, max: 96700, rate: 0 },
  { min: 96700, max: 600050, rate: 0.15 },
  { min: 600050, max: Infinity, rate: 0.20 }
]

const CAP_GAINS_BRACKETS_2025_SINGLE = [
  { min: 0, max: 48350, rate: 0 },
  { min: 48350, max: 533400, rate: 0.15 },
  { min: 533400, max: Infinity, rate: 0.20 }
]

// RMD factors (Uniform Lifetime Table - simplified)
const RMD_FACTORS: { [age: number]: number } = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7,
  89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9
}

// Calculate taxable portion of Social Security benefits
const calculateTaxableSS = (
  ssIncome: number,
  otherIncome: number, // All other income (ordinary, cap gains, SE net earnings, etc.)
  isMarried: boolean
): number => {
  if (ssIncome <= 0) return 0

  // Provisional income = other income + 50% of SS benefits
  const provisionalIncome = otherIncome + (ssIncome * 0.5)

  // Thresholds differ by filing status
  const thresholds = isMarried
    ? { first: 32000, second: 44000 }
    : { first: 25000, second: 34000 }

  let taxableSS = 0

  if (provisionalIncome <= thresholds.first) {
    // Below first threshold: 0% taxable
    taxableSS = 0
  } else if (provisionalIncome <= thresholds.second) {
    // Between thresholds: up to 50% taxable
    // Taxable = lesser of: 50% of SS OR 50% of (provisional - first threshold)
    taxableSS = Math.min(
      ssIncome * 0.5,
      (provisionalIncome - thresholds.first) * 0.5
    )
  } else {
    // Above second threshold: up to 85% taxable
    // Taxable = lesser of: 85% of SS OR
    //   85% of (provisional - second threshold) + lesser of:
    //     (second - first threshold) * 0.5 OR 50% of SS
    const amountOver2nd = provisionalIncome - thresholds.second
    const amountBetween = thresholds.second - thresholds.first
    const taxableFromMiddle = Math.min(amountBetween * 0.5, ssIncome * 0.5)

    taxableSS = Math.min(
      ssIncome * 0.85,
      (amountOver2nd * 0.85) + taxableFromMiddle
    )
  }

  return Math.max(0, taxableSS)
}

type ScenarioType =
  | 'ordinary_income'
  | 'capital_gain_income'
  | 'se_income'
  | 'ss_income'
  | 'nontaxable_income'
  | 'discretionary_expense'
  | 'traditional_contribution'
  | 'roth_contribution'
  | 'roth_conversion'

interface Scenario {
  id: string
  name: string
  type: ScenarioType
  startAge: number
  endAge: number
  amount: number
  growthRate: number
}

interface ForecastInput {
  clientName: string
  isMarried: boolean
  clientAge: number
  spouseAge: number
  ordinaryIncome: number
  capitalGainsIncome: number
  selfEmploymentIncome: number
  socialSecurityIncome: number
  nonTaxableIncome: number
  nonRetirementBalance: number
  traditionalBalance: number
  rothBalance: number
  discretionaryExpenses: number
  growthRate: number
  inflationRate: number
  capitalGainsPct: number
  withdrawalOrder: 'non_retirement_first' | 'retirement_first'
  scenarios: Scenario[]
}

interface YearlyProjection {
  year: number
  clientAge: number
  spouseAge: number | null
  ordinaryIncome: number
  capitalGainsIncome: number
  selfEmploymentIncome: number
  socialSecurityIncome: number
  nonTaxableIncome: number
  totalIncome: number
  discretionaryExpenses: number
  traditionalContribution: number
  rothContribution: number
  rothConversion: number
  excessDeficit: number
  nonRetirementEarnings: number
  traditionalEarnings: number
  rothEarnings: number
  totalEarnings: number
  nonRetirementBalance: number
  traditionalBalance: number
  rothBalance: number
  totalBalance: number
  rmdAmount: number
  taxableIncome: number
  federalTax: number
  selfEmploymentTax: number
  totalTax: number
  effectiveTaxRate: number
  activeScenarios: string[]
  milestones: string[]
}

interface MonteCarloResult {
  percentile10: number[]
  percentile25: number[]
  percentile50: number[]
  percentile75: number[]
  percentile90: number[]
  failureRate: number
}

const formatCurrency = (amount: number): string => {
  if (Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercent = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const SCENARIO_TYPE_LABELS: Record<ScenarioType, string> = {
  ordinary_income: 'Ordinary Income',
  capital_gain_income: 'Capital Gain Income',
  se_income: 'Self-Employment Income',
  ss_income: 'Social Security Income',
  nontaxable_income: 'Non-Taxable Income',
  discretionary_expense: 'Discretionary Expense',
  traditional_contribution: 'Traditional Contribution',
  roth_contribution: 'Roth Contribution',
  roth_conversion: 'Roth Conversion'
}

export function FinancialForecast() {
  const printRef = useRef<HTMLDivElement>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showMonteCarlo, setShowMonteCarlo] = useState(false)
  const [showScenarios, setShowScenarios] = useState(false)
  const [projections, setProjections] = useState<YearlyProjection[]>([])
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null)

  const currentYear = new Date().getFullYear()

  const [input, setInput] = useState<ForecastInput>({
    clientName: '',
    isMarried: true,
    clientAge: 55,
    spouseAge: 53,
    ordinaryIncome: 0,
    capitalGainsIncome: 0,
    selfEmploymentIncome: 0,
    socialSecurityIncome: 0,
    nonTaxableIncome: 0,
    nonRetirementBalance: 0,
    traditionalBalance: 0,
    rothBalance: 0,
    discretionaryExpenses: 0,
    growthRate: 6,
    inflationRate: 3,
    capitalGainsPct: 30,
    withdrawalOrder: 'non_retirement_first',
    scenarios: []
  })

  const handleInputChange = (field: keyof ForecastInput, value: string | number | boolean) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const handleNumberInput = (field: keyof ForecastInput, value: string) => {
    const num = parseFloat(value.replace(/,/g, '')) || 0
    handleInputChange(field, num)
  }

  const addScenario = () => {
    const newScenario: Scenario = {
      id: generateId(),
      name: `Scenario ${input.scenarios.length + 1}`,
      type: 'ordinary_income',
      startAge: input.clientAge,
      endAge: input.clientAge + 10,
      amount: 0,
      growthRate: 0
    }
    setInput(prev => ({ ...prev, scenarios: [...prev.scenarios, newScenario] }))
  }

  const updateScenario = (id: string, field: keyof Scenario, value: string | number) => {
    setInput(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    }))
  }

  const removeScenario = (id: string) => {
    setInput(prev => ({
      ...prev,
      scenarios: prev.scenarios.filter(s => s.id !== id)
    }))
  }

  const calculateTax = (
    ordinaryIncome: number,
    capitalGains: number,
    selfEmploymentIncome: number,
    isMarried: boolean,
    inflationFactor: number
  ) => {
    const brackets = isMarried ? TAX_BRACKETS_2025_MFJ : TAX_BRACKETS_2025_SINGLE
    const capGainsBrackets = isMarried ? CAP_GAINS_BRACKETS_2025_MFJ : CAP_GAINS_BRACKETS_2025_SINGLE
    const standardDeduction = (isMarried ? STANDARD_DEDUCTION_2025.mfj : STANDARD_DEDUCTION_2025.single) * inflationFactor

    const seNetEarnings = selfEmploymentIncome * 0.9235
    const ssTax = Math.min(seNetEarnings, 176100 * inflationFactor) * 0.124
    const medicareTax = seNetEarnings * 0.029
    const selfEmploymentTax = ssTax + medicareTax
    const seDeduction = selfEmploymentTax * 0.5

    const agi = ordinaryIncome + capitalGains + seNetEarnings
    const taxableIncome = Math.max(0, agi - standardDeduction - seDeduction)
    const taxableOrdinary = Math.max(0, taxableIncome - capitalGains)
    const taxableCapGains = Math.min(capitalGains, taxableIncome)

    let ordinaryTax = 0
    let remainingIncome = taxableOrdinary
    for (const bracket of brackets) {
      if (remainingIncome <= 0) break
      const inflatedMax = bracket.max === Infinity ? Infinity : bracket.max * inflationFactor
      const inflatedMin = bracket.min * inflationFactor
      const bracketSize = inflatedMax - inflatedMin
      const taxableInBracket = Math.min(remainingIncome, bracketSize)
      ordinaryTax += taxableInBracket * bracket.rate
      remainingIncome -= taxableInBracket
    }

    let capGainsTax = 0
    let incomeForCapGains = taxableOrdinary
    let remainingCapGains = taxableCapGains
    for (const bracket of capGainsBrackets) {
      if (remainingCapGains <= 0) break
      const inflatedMax = bracket.max === Infinity ? Infinity : bracket.max * inflationFactor
      const roomInBracket = Math.max(0, inflatedMax - incomeForCapGains)
      const gainsInBracket = Math.min(remainingCapGains, roomInBracket)
      capGainsTax += gainsInBracket * bracket.rate
      remainingCapGains -= gainsInBracket
      incomeForCapGains += gainsInBracket
    }

    return {
      taxableIncome,
      federalTax: ordinaryTax + capGainsTax,
      selfEmploymentTax,
      totalTax: ordinaryTax + capGainsTax + selfEmploymentTax
    }
  }

  const calculateRMD = (traditionalBalance: number, age: number): number => {
    if (age < 73) return 0
    const factor = RMD_FACTORS[age] || 10
    return traditionalBalance / factor
  }

  const generateProjections = () => {
    const projections: YearlyProjection[] = []
    let nonRetirementBalance = input.nonRetirementBalance
    let traditionalBalance = input.traditionalBalance
    let rothBalance = input.rothBalance

    const growthRate = input.growthRate / 100
    const inflationRate = input.inflationRate / 100

    for (let yearOffset = 0; yearOffset < 20; yearOffset++) {
      const year = currentYear + yearOffset
      const clientAge = input.clientAge + yearOffset
      const spouseAge = input.isMarried ? input.spouseAge + yearOffset : null
      const inflationFactor = Math.pow(1 + inflationRate, yearOffset)

      const activeScenarios: string[] = []
      let scenarioOrdinaryIncome = 0
      let scenarioCapitalGainsIncome = 0
      let scenarioSEIncome = 0
      let scenarioSSIncome = 0
      let scenarioNonTaxableIncome = 0
      let scenarioDiscretionaryExpense = 0
      let scenarioTraditionalContribution = 0
      let scenarioRothContribution = 0
      let scenarioRothConversion = 0

      for (const scenario of input.scenarios) {
        if (clientAge >= scenario.startAge && clientAge <= scenario.endAge) {
          activeScenarios.push(scenario.name)
          const yearsIntoScenario = clientAge - scenario.startAge
          const scenarioAmount = scenario.amount * Math.pow(1 + scenario.growthRate / 100, yearsIntoScenario)

          switch (scenario.type) {
            case 'ordinary_income': scenarioOrdinaryIncome += scenarioAmount; break
            case 'capital_gain_income': scenarioCapitalGainsIncome += scenarioAmount; break
            case 'se_income': scenarioSEIncome += scenarioAmount; break
            case 'ss_income': scenarioSSIncome += scenarioAmount; break
            case 'nontaxable_income': scenarioNonTaxableIncome += scenarioAmount; break
            case 'discretionary_expense': scenarioDiscretionaryExpense += scenarioAmount; break
            case 'traditional_contribution': scenarioTraditionalContribution += scenarioAmount; break
            case 'roth_contribution': scenarioRothContribution += scenarioAmount; break
            case 'roth_conversion': scenarioRothConversion += scenarioAmount; break
          }
        }
      }

      const ordinaryIncome = input.ordinaryIncome * inflationFactor + scenarioOrdinaryIncome
      const capitalGainsIncome = input.capitalGainsIncome * inflationFactor + scenarioCapitalGainsIncome
      const selfEmploymentIncome = input.selfEmploymentIncome * inflationFactor + scenarioSEIncome
      const socialSecurityIncome = input.socialSecurityIncome * inflationFactor + scenarioSSIncome
      const nonTaxableIncome = input.nonTaxableIncome * inflationFactor + scenarioNonTaxableIncome

      const discretionaryExpenses = input.discretionaryExpenses * inflationFactor + scenarioDiscretionaryExpense
      const traditionalContribution = scenarioTraditionalContribution
      const rothContribution = scenarioRothContribution

      // Calculate required RMD (minimum that MUST come from Traditional)
      const rmdRequired = calculateRMD(traditionalBalance, clientAge)

      // Step 1: Calculate base income (before any retirement withdrawals)
      const baseIncome = ordinaryIncome + capitalGainsIncome + selfEmploymentIncome +
        socialSecurityIncome + nonTaxableIncome

      // Step 2: Determine cash needed (expenses + contributions)
      const cashNeeded = discretionaryExpenses + traditionalContribution + rothContribution

      // Step 3: Calculate deficit that must be covered by withdrawals
      let deficit = Math.max(0, cashNeeded - baseIncome)

      // Step 4: Determine withdrawals from each account type
      let traditionalWithdrawal = 0
      let rothWithdrawal = 0
      let nonRetirementWithdrawal = 0

      if (input.withdrawalOrder === 'non_retirement_first') {
        // First, withdraw from non-retirement (taxable account - only gains are taxed, simplified here)
        if (deficit > 0 && nonRetirementBalance > 0) {
          nonRetirementWithdrawal = Math.min(deficit, nonRetirementBalance)
          deficit -= nonRetirementWithdrawal
        }
        // Then from Traditional (fully taxable as ordinary income)
        if (deficit > 0 && traditionalBalance > 0) {
          traditionalWithdrawal = Math.min(deficit, traditionalBalance)
          deficit -= traditionalWithdrawal
        }
        // Then from Roth (tax-free)
        if (deficit > 0 && rothBalance > 0) {
          rothWithdrawal = Math.min(deficit, rothBalance)
          deficit -= rothWithdrawal
        }
      } else {
        // Retirement first: Traditional, then Roth, then Non-Retirement
        if (deficit > 0 && traditionalBalance > 0) {
          traditionalWithdrawal = Math.min(deficit, traditionalBalance)
          deficit -= traditionalWithdrawal
        }
        if (deficit > 0 && rothBalance > 0) {
          rothWithdrawal = Math.min(deficit, rothBalance)
          deficit -= rothWithdrawal
        }
        if (deficit > 0 && nonRetirementBalance > 0) {
          nonRetirementWithdrawal = Math.min(deficit, nonRetirementBalance)
          deficit -= nonRetirementWithdrawal
        }
      }

      // Step 5: Ensure RMD is satisfied
      // If Traditional withdrawal already >= RMD, no additional withdrawal needed
      // If Traditional withdrawal < RMD, must withdraw at least the RMD
      let additionalRmdWithdrawal = 0
      if (rmdRequired > traditionalWithdrawal) {
        additionalRmdWithdrawal = Math.min(rmdRequired - traditionalWithdrawal, traditionalBalance - traditionalWithdrawal)
        traditionalWithdrawal += additionalRmdWithdrawal
        // This extra RMD goes to non-retirement after taxes
      }

      // Total Traditional withdrawal is taxable income
      const totalTraditionalWithdrawal = traditionalWithdrawal

      // The actual RMD amount (for display) is the minimum of required and what was withdrawn
      const rmdAmount = Math.min(rmdRequired, totalTraditionalWithdrawal)

      // Step 6: Calculate investment earnings (on beginning-of-year balances)
      // Non-retirement earnings are partially taxable; Traditional/Roth grow tax-deferred
      const nonRetirementEarnings = nonRetirementBalance * growthRate
      const traditionalEarnings = traditionalBalance * growthRate
      const rothEarnings = rothBalance * growthRate

      // Step 7: Calculate taxable portion of non-retirement EARNINGS
      // capitalGainsPct% of earnings are taxed as capital gains (long-term gains, qualified dividends)
      // Remaining earnings are taxed as ordinary income (interest, short-term gains, non-qualified dividends)
      // Withdrawals are tax-free return of capital
      const nonRetCapGainsEarnings = nonRetirementEarnings * (input.capitalGainsPct / 100)
      const nonRetOrdinaryEarnings = nonRetirementEarnings * (1 - input.capitalGainsPct / 100)

      // Step 8: Calculate taxes with all taxable income
      const seNetEarnings = selfEmploymentIncome * 0.9235
      const otherIncomeForSS = ordinaryIncome + capitalGainsIncome + seNetEarnings + totalTraditionalWithdrawal + nonRetCapGainsEarnings + nonRetOrdinaryEarnings
      const taxableSS = calculateTaxableSS(socialSecurityIncome, otherIncomeForSS, input.isMarried)

      const taxCalc = calculateTax(
        ordinaryIncome + taxableSS + totalTraditionalWithdrawal + scenarioRothConversion + nonRetOrdinaryEarnings,
        capitalGainsIncome + nonRetCapGainsEarnings,
        selfEmploymentIncome,
        input.isMarried,
        inflationFactor
      )

      // Step 9: Calculate total income (includes Traditional withdrawal and all taxable earnings)
      const totalIncome = baseIncome + totalTraditionalWithdrawal + nonRetirementEarnings

      // Step 10: Calculate net cash flow
      // Income + withdrawals - expenses - taxes - contributions
      // Non-retirement withdrawals are tax-free (return of capital)
      const grossCashIn = baseIncome + totalTraditionalWithdrawal + rothWithdrawal + nonRetirementWithdrawal
      const netCashFlow = grossCashIn - discretionaryExpenses - taxCalc.totalTax - traditionalContribution - rothContribution

      // Step 11: Update account balances (withdrawals)
      traditionalBalance -= totalTraditionalWithdrawal
      rothBalance -= rothWithdrawal
      nonRetirementBalance -= nonRetirementWithdrawal

      // Handle contributions
      traditionalBalance += traditionalContribution
      rothBalance += rothContribution

      // Handle Roth conversion (taxed in taxCalc above via scenarioRothConversion)
      if (scenarioRothConversion > 0 && traditionalBalance >= scenarioRothConversion) {
        traditionalBalance -= scenarioRothConversion
        rothBalance += scenarioRothConversion
      }

      // Any excess cash (after taxes) goes to non-retirement
      if (netCashFlow > 0) {
        nonRetirementBalance += netCashFlow
      }

      // Step 12: Apply investment earnings to balances
      nonRetirementBalance += nonRetirementEarnings
      traditionalBalance += traditionalEarnings
      rothBalance += rothEarnings

      const milestones: string[] = []
      if (clientAge === 67) milestones.push('SS FRA')
      if (clientAge === 73 && rmdRequired > 0) milestones.push('RMDs Begin')
      if (clientAge === 62) milestones.push('SS Earliest')
      if (clientAge === 65) milestones.push('Medicare')

      projections.push({
        year,
        clientAge,
        spouseAge,
        ordinaryIncome,
        capitalGainsIncome,
        selfEmploymentIncome,
        socialSecurityIncome,
        nonTaxableIncome,
        totalIncome,
        discretionaryExpenses,
        traditionalContribution,
        rothContribution,
        rothConversion: scenarioRothConversion,
        excessDeficit: netCashFlow,
        nonRetirementEarnings,
        traditionalEarnings,
        rothEarnings,
        totalEarnings: nonRetirementEarnings + traditionalEarnings + rothEarnings,
        nonRetirementBalance,
        traditionalBalance,
        rothBalance,
        totalBalance: nonRetirementBalance + traditionalBalance + rothBalance,
        rmdAmount,
        taxableIncome: taxCalc.taxableIncome,
        federalTax: taxCalc.federalTax,
        selfEmploymentTax: taxCalc.selfEmploymentTax,
        totalTax: taxCalc.totalTax,
        effectiveTaxRate: totalIncome > 0 ? taxCalc.totalTax / totalIncome : 0,
        activeScenarios,
        milestones
      })
    }

    setProjections(projections)
    toast.success("Forecast generated!")
  }

  const runMonteCarlo = () => {
    const simulations = 1000
    const years = 20
    const results: number[][] = []

    const baseGrowth = input.growthRate / 100
    const volatility = 0.15

    for (let sim = 0; sim < simulations; sim++) {
      let nonRetirement = input.nonRetirementBalance
      let traditional = input.traditionalBalance
      let roth = input.rothBalance
      const yearEndBalances: number[] = []

      for (let year = 0; year < years; year++) {
        const randomReturn = baseGrowth + volatility * (Math.random() + Math.random() + Math.random() - 1.5) * 2

        nonRetirement *= (1 + randomReturn)
        traditional *= (1 + randomReturn)
        roth *= (1 + randomReturn)

        const inflationFactor = Math.pow(1 + input.inflationRate / 100, year)
        const annualExpenses = input.discretionaryExpenses * inflationFactor

        if (annualExpenses > 0) {
          let remaining = annualExpenses
          if (nonRetirement > 0) {
            const withdrawal = Math.min(remaining, nonRetirement)
            nonRetirement -= withdrawal
            remaining -= withdrawal
          }
          if (remaining > 0 && traditional > 0) {
            const withdrawal = Math.min(remaining, traditional)
            traditional -= withdrawal
            remaining -= withdrawal
          }
          if (remaining > 0 && roth > 0) {
            const withdrawal = Math.min(remaining, roth)
            roth -= withdrawal
            remaining -= withdrawal
          }
        }

        yearEndBalances.push(nonRetirement + traditional + roth)
      }

      results.push(yearEndBalances)
    }

    const percentile10: number[] = []
    const percentile25: number[] = []
    const percentile50: number[] = []
    const percentile75: number[] = []
    const percentile90: number[] = []

    for (let year = 0; year < years; year++) {
      const yearBalances = results.map(r => r[year]).sort((a, b) => a - b)
      percentile10.push(yearBalances[Math.floor(simulations * 0.10)])
      percentile25.push(yearBalances[Math.floor(simulations * 0.25)])
      percentile50.push(yearBalances[Math.floor(simulations * 0.50)])
      percentile75.push(yearBalances[Math.floor(simulations * 0.75)])
      percentile90.push(yearBalances[Math.floor(simulations * 0.90)])
    }

    const failures = results.filter(r => r[years - 1] <= 0).length
    const failureRate = failures / simulations

    setMonteCarloResult({
      percentile10,
      percentile25,
      percentile50,
      percentile75,
      percentile90,
      failureRate
    })

    setShowMonteCarlo(true)
    toast.success(`Monte Carlo simulation complete`)
  }

  const handlePrint = () => {
    window.print()
  }

  const clearForm = () => {
    setInput({
      clientName: '',
      isMarried: true,
      clientAge: 55,
      spouseAge: 53,
      ordinaryIncome: 0,
      capitalGainsIncome: 0,
      selfEmploymentIncome: 0,
      socialSecurityIncome: 0,
      nonTaxableIncome: 0,
      nonRetirementBalance: 0,
      traditionalBalance: 0,
      rothBalance: 0,
      discretionaryExpenses: 0,
      growthRate: 6,
      inflationRate: 3,
      capitalGainsPct: 30,
      withdrawalOrder: 'non_retirement_first',
      scenarios: []
    })
    setProjections([])
    setMonteCarloResult(null)
    toast.info("Form cleared")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 print:hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/assistant">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">20-Year Financial Forecast</h1>
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

      <div className="container mx-auto px-4 py-4" ref={printRef}>
        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">20-Year Financial Forecast</h1>
          {input.clientName && <p className="text-center text-lg mt-2">Client: {input.clientName}</p>}
          <p className="text-center text-sm text-muted-foreground mt-1">
            Prepared on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* INPUT SECTION - Compact horizontal layout at top */}
        <div className="print:hidden space-y-4 mb-6">
          {/* Row 1: Personal Info & Income */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Personal Info */}
            <Card className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <User className="w-4 h-4" />
                Personal
              </h3>
              <div className="space-y-2">
                <Input
                  placeholder="Client Name"
                  className="h-8 text-sm"
                  value={input.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isMarried"
                    checked={input.isMarried}
                    onChange={(e) => handleInputChange('isMarried', e.target.checked)}
                    className="w-3 h-3"
                  />
                  <label htmlFor="isMarried" className="text-xs">Married</label>
                  <Input
                    type="number"
                    placeholder="Age"
                    className="h-8 text-sm w-16"
                    value={input.clientAge}
                    onChange={(e) => handleInputChange('clientAge', parseInt(e.target.value) || 55)}
                  />
                  {input.isMarried && (
                    <Input
                      type="number"
                      placeholder="Sp Age"
                      className="h-8 text-sm w-16"
                      value={input.spouseAge}
                      onChange={(e) => handleInputChange('spouseAge', parseInt(e.target.value) || 53)}
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Income Sources */}
            <Card className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Annual Income
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Ordinary</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.ordinaryIncome ? input.ordinaryIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('ordinaryIncome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cap Gains</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.capitalGainsIncome ? input.capitalGainsIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('capitalGainsIncome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">SE Income</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.selfEmploymentIncome ? input.selfEmploymentIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('selfEmploymentIncome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Soc Sec</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.socialSecurityIncome ? input.socialSecurityIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('socialSecurityIncome', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Portfolio Balances */}
            <Card className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                Portfolio ({formatCurrency(input.nonRetirementBalance + input.traditionalBalance + input.rothBalance)})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Non-Ret</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.nonRetirementBalance ? input.nonRetirementBalance.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('nonRetirementBalance', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Trad IRA</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.traditionalBalance ? input.traditionalBalance.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('traditionalBalance', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Roth</label>
                  <Input
                    type="text"
                    placeholder="0"
                    className="h-7 text-sm"
                    value={input.rothBalance ? input.rothBalance.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('rothBalance', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Expenses & Settings */}
            <Card className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <PiggyBank className="w-4 h-4" />
                Settings
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Expenses</label>
                    <Input
                      type="text"
                      placeholder="0"
                      className="h-7 text-sm"
                      value={input.discretionaryExpenses ? input.discretionaryExpenses.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('discretionaryExpenses', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Growth %</label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-7 text-sm"
                      value={input.growthRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleInputChange('growthRate', isNaN(val) ? 6 : val)
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Inflation %</label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-7 text-sm"
                      value={input.inflationRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleInputChange('inflationRate', isNaN(val) ? 3 : val)
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">CG % W/D</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-7 text-sm"
                      value={input.capitalGainsPct}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleInputChange('capitalGainsPct', isNaN(val) ? 30 : val)
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Withdraw</label>
                    <Select
                      value={input.withdrawalOrder}
                      onValueChange={(v) => handleInputChange('withdrawalOrder', v)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non_retirement_first">Non-Ret 1st</SelectItem>
                        <SelectItem value="retirement_first">Ret 1st</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">CG % = % of earnings taxed as cap gains; rest taxed as ordinary income (withdrawals are tax-free)</p>
              </div>
            </Card>
          </div>

          {/* Row 2: Scenarios (Collapsible) */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowScenarios(!showScenarios)}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <LineChart className="w-4 h-4" />
                Scenarios ({input.scenarios.length})
                {showScenarios ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addScenario}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Scenario
                </Button>
                <Button onClick={generateProjections} size="sm">
                  <Calculator className="w-3 h-3 mr-1" />
                  Generate Forecast
                </Button>
                {projections.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={runMonteCarlo}>
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Monte Carlo
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearForm}>
                  Clear
                </Button>
              </div>
            </div>

            {showScenarios && input.scenarios.length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {input.scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-2 border rounded-lg space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Input
                        className="h-7 text-sm w-28"
                        value={scenario.name}
                        onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                      />
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeScenario(scenario.id)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                    <Select
                      value={scenario.type}
                      onValueChange={(v) => updateScenario(scenario.id, 'type', v as ScenarioType)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SCENARIO_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-4 gap-1">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Start</label>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          value={scenario.startAge}
                          onChange={(e) => updateScenario(scenario.id, 'startAge', parseInt(e.target.value) || input.clientAge)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">End</label>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          value={scenario.endAge}
                          onChange={(e) => updateScenario(scenario.id, 'endAge', parseInt(e.target.value) || input.clientAge + 10)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Amount</label>
                        <Input
                          type="text"
                          className="h-6 text-xs"
                          placeholder="0"
                          value={scenario.amount ? scenario.amount.toLocaleString() : ''}
                          onChange={(e) => updateScenario(scenario.id, 'amount', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Grw%</label>
                        <Input
                          type="number"
                          step="0.1"
                          className="h-6 text-xs"
                          value={scenario.growthRate}
                          onChange={(e) => updateScenario(scenario.id, 'growthRate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showScenarios && input.scenarios.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground text-center py-2">
                Add scenarios to model retirement, income changes, Roth conversions, etc.
              </p>
            )}
          </Card>
        </div>

        {/* OUTPUT SECTION - Full width below inputs */}
        {projections.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Starting Balance</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(input.nonRetirementBalance + input.traditionalBalance + input.rothBalance)}
                </p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Year 20 Balance</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(projections[19]?.totalBalance || 0)}
                </p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Avg Effective Tax</p>
                <p className="text-lg font-bold">
                  {formatPercent(projections.reduce((sum, p) => sum + p.effectiveTaxRate, 0) / projections.length)}
                </p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Taxes (20yr)</p>
                <p className="text-lg font-bold text-red-500">
                  {formatCurrency(projections.reduce((sum, p) => sum + p.totalTax, 0))}
                </p>
              </Card>
            </div>

            {/* Main Projection Table */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                20-Year Projection
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b">
                      <th className="text-left py-2 px-1">Year</th>
                      <th className="text-center py-2 px-1">Age</th>
                      <th className="text-right py-2 px-1">Income</th>
                      <th className="text-right py-2 px-1">Expenses</th>
                      <th className="text-right py-2 px-1">Cash Flow</th>
                      <th className="text-right py-2 px-1">Earnings</th>
                      <th className="text-right py-2 px-1">Non-Ret</th>
                      <th className="text-right py-2 px-1">Trad</th>
                      <th className="text-right py-2 px-1">Roth</th>
                      <th className="text-right py-2 px-1 font-bold">Total</th>
                      <th className="text-right py-2 px-1">Tax</th>
                      <th className="text-left py-2 px-1">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((proj) => {
                      const hasMilestone = proj.milestones.length > 0
                      const hasRMD = proj.rmdAmount > 0
                      return (
                        <tr
                          key={proj.year}
                          className={`border-b ${hasMilestone ? 'bg-amber-50 dark:bg-amber-900/20' : ''} ${hasRMD ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                        >
                          <td className="py-1 px-1">{proj.year}</td>
                          <td className="text-center py-1 px-1">
                            {proj.clientAge}{proj.spouseAge && `/${proj.spouseAge}`}
                          </td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.totalIncome)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.discretionaryExpenses)}</td>
                          <td className={`text-right py-1 px-1 ${proj.excessDeficit < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {formatCurrency(proj.excessDeficit)}
                          </td>
                          <td className="text-right py-1 px-1 text-green-600">{formatCurrency(proj.totalEarnings)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.nonRetirementBalance)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.traditionalBalance)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.rothBalance)}</td>
                          <td className="text-right py-1 px-1 font-bold">{formatCurrency(proj.totalBalance)}</td>
                          <td className="text-right py-1 px-1 text-red-500">{formatCurrency(proj.totalTax)}</td>
                          <td className="text-left py-1 px-1 text-[10px] max-w-[150px] truncate">
                            {proj.milestones.join(', ')}
                            {proj.rmdAmount > 0 && ` RMD:${formatCurrency(proj.rmdAmount)}`}
                            {proj.activeScenarios.length > 0 && ` [${proj.activeScenarios.join(', ')}]`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Monte Carlo Results */}
            {showMonteCarlo && monteCarloResult && (
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monte Carlo Simulation (1,000 scenarios)
                </h2>

                <div className={`p-3 rounded-lg mb-4 ${monteCarloResult.failureRate > 0.1 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                  <p className="text-lg font-semibold">
                    Success Rate: {formatPercent(1 - monteCarloResult.failureRate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {monteCarloResult.failureRate > 0.1 ? 'Warning: >10% chance of running out' : 'Good: <10% chance of running out'}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Year</th>
                        <th className="text-right py-2">10th %ile</th>
                        <th className="text-right py-2">25th %ile</th>
                        <th className="text-right py-2 font-bold">Median</th>
                        <th className="text-right py-2">75th %ile</th>
                        <th className="text-right py-2">90th %ile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 4, 9, 14, 19].map((idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{currentYear + idx}</td>
                          <td className="text-right py-2 text-red-500">{formatCurrency(monteCarloResult.percentile10[idx])}</td>
                          <td className="text-right py-2">{formatCurrency(monteCarloResult.percentile25[idx])}</td>
                          <td className="text-right py-2 font-bold">{formatCurrency(monteCarloResult.percentile50[idx])}</td>
                          <td className="text-right py-2">{formatCurrency(monteCarloResult.percentile75[idx])}</td>
                          <td className="text-right py-2 text-green-600">{formatCurrency(monteCarloResult.percentile90[idx])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Detailed Breakdown (Collapsible) */}
            <Card className="p-4 print:hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-lg font-semibold"
              >
                <span>Detailed Income & Tax Breakdown</span>
                {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showDetails && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b">
                        <th className="text-left py-2 px-1">Year</th>
                        <th className="text-right py-2 px-1">Ordinary</th>
                        <th className="text-right py-2 px-1">Cap Gains</th>
                        <th className="text-right py-2 px-1">SE Inc</th>
                        <th className="text-right py-2 px-1">SS</th>
                        <th className="text-right py-2 px-1">RMD</th>
                        <th className="text-right py-2 px-1">Roth Conv</th>
                        <th className="text-right py-2 px-1">Fed Tax</th>
                        <th className="text-right py-2 px-1">SE Tax</th>
                        <th className="text-right py-2 px-1">Eff Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map((proj) => (
                        <tr key={proj.year} className="border-b">
                          <td className="py-1 px-1">{proj.year}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.ordinaryIncome)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.capitalGainsIncome)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.selfEmploymentIncome)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.socialSecurityIncome)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.rmdAmount)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.rothConversion)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.federalTax)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(proj.selfEmploymentTax)}</td>
                          <td className="text-right py-1 px-1">{formatPercent(proj.effectiveTaxRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              This projection is for planning purposes only. Actual results will vary. Consult a financial advisor.
            </p>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Enter Information Above</h3>
            <p className="text-muted-foreground">
              Fill in your information, optionally add scenarios for income changes or retirement,
              then click "Generate Forecast" to see your 20-year projection.
            </p>
            <div className="mt-6 p-4 bg-primary/5 rounded-lg text-left max-w-md mx-auto">
              <h4 className="font-medium mb-2 text-sm">Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- Add a scenario to stop income at retirement age</li>
                <li>- Add SS Income scenario starting at 62-70</li>
                <li>- Consider Roth conversions before RMDs at 73</li>
                <li>- Run Monte Carlo to stress-test your plan</li>
              </ul>
            </div>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}
