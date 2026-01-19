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
  FileText,
  User,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Tax brackets and rates for 2024 and 2025
const TAX_DATA = {
  2024: {
    brackets: {
      single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
      ],
      mfj: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
      ],
      hoh: [
        { min: 0, max: 16550, rate: 0.10 },
        { min: 16550, max: 63100, rate: 0.12 },
        { min: 63100, max: 100500, rate: 0.22 },
        { min: 100500, max: 191950, rate: 0.24 },
        { min: 191950, max: 243700, rate: 0.32 },
        { min: 243700, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
      ]
    },
    standardDeduction: {
      single: 14600,
      mfj: 29200,
      hoh: 21900
    },
    additionalStdDeduction: {
      single: 1950,
      mfj: 1550,
      hoh: 1950
    },
    capGainsBrackets: {
      single: [
        { min: 0, max: 47025, rate: 0 },
        { min: 47025, max: 518900, rate: 0.15 },
        { min: 518900, max: Infinity, rate: 0.20 }
      ],
      mfj: [
        { min: 0, max: 94050, rate: 0 },
        { min: 94050, max: 583750, rate: 0.15 },
        { min: 583750, max: Infinity, rate: 0.20 }
      ],
      hoh: [
        { min: 0, max: 63000, rate: 0 },
        { min: 63000, max: 551350, rate: 0.15 },
        { min: 551350, max: Infinity, rate: 0.20 }
      ]
    },
    ssWageBase: 168600,
    niitThreshold: { single: 200000, mfj: 250000, hoh: 200000 },
    additionalMedicareThreshold: { single: 200000, mfj: 250000, hoh: 200000 },
    qbiThreshold: { single: 191950, mfj: 383900, hoh: 191950 },
    qbiPhaseoutRange: { single: 50000, mfj: 100000, hoh: 50000 },
    childTaxCredit: 2000
  },
  2025: {
    brackets: {
      single: [
        { min: 0, max: 11925, rate: 0.10 },
        { min: 11925, max: 48475, rate: 0.12 },
        { min: 48475, max: 103350, rate: 0.22 },
        { min: 103350, max: 197300, rate: 0.24 },
        { min: 197300, max: 250525, rate: 0.32 },
        { min: 250525, max: 626350, rate: 0.35 },
        { min: 626350, max: Infinity, rate: 0.37 }
      ],
      mfj: [
        { min: 0, max: 23850, rate: 0.10 },
        { min: 23850, max: 96950, rate: 0.12 },
        { min: 96950, max: 206700, rate: 0.22 },
        { min: 206700, max: 394600, rate: 0.24 },
        { min: 394600, max: 501050, rate: 0.32 },
        { min: 501050, max: 751600, rate: 0.35 },
        { min: 751600, max: Infinity, rate: 0.37 }
      ],
      hoh: [
        { min: 0, max: 17000, rate: 0.10 },
        { min: 17000, max: 64850, rate: 0.12 },
        { min: 64850, max: 103350, rate: 0.22 },
        { min: 103350, max: 197300, rate: 0.24 },
        { min: 197300, max: 250500, rate: 0.32 },
        { min: 250500, max: 626350, rate: 0.35 },
        { min: 626350, max: Infinity, rate: 0.37 }
      ]
    },
    // Updated per One Big Beautiful Bill Act (OBBB) - signed July 4, 2025
    standardDeduction: {
      single: 15750,
      mfj: 31500,
      hoh: 23625
    },
    additionalStdDeduction: {
      single: 2000,
      mfj: 1600,
      hoh: 2000
    },
    capGainsBrackets: {
      single: [
        { min: 0, max: 48350, rate: 0 },
        { min: 48350, max: 533400, rate: 0.15 },
        { min: 533400, max: Infinity, rate: 0.20 }
      ],
      mfj: [
        { min: 0, max: 96700, rate: 0 },
        { min: 96700, max: 600050, rate: 0.15 },
        { min: 600050, max: Infinity, rate: 0.20 }
      ],
      hoh: [
        { min: 0, max: 64750, rate: 0 },
        { min: 64750, max: 566700, rate: 0.15 },
        { min: 566700, max: Infinity, rate: 0.20 }
      ]
    },
    ssWageBase: 176100,
    niitThreshold: { single: 200000, mfj: 250000, hoh: 200000 },
    additionalMedicareThreshold: { single: 200000, mfj: 250000, hoh: 200000 },
    qbiThreshold: { single: 197300, mfj: 394600, hoh: 197300 },
    qbiPhaseoutRange: { single: 50000, mfj: 100000, hoh: 50000 },
    childTaxCredit: 2000
  }
}

type FilingStatus = 'single' | 'mfj' | 'hoh'
type TaxYear = 2024 | 2025

interface TaxInput {
  clientName: string
  taxYear: TaxYear
  filingStatus: FilingStatus
  childrenUnder17: number
  age65OrOlder: boolean
  spouse65OrOlder: boolean // For MFJ - is spouse also 65+?
  // Income
  ordinaryIncome: number
  qualifiedDividends: number
  shortTermCapGains: number
  longTermCapGains: number
  selfEmploymentIncome: number
  socialSecurityIncome: number
  // Deductions
  useStandardDeduction: boolean
  itemizedDeductions: number
  // QBI
  isSSTB: boolean // Specified Service Trade or Business
  // Payments
  withholding: number
  estimatedPayments: number
}

interface TaxResult {
  // Income
  totalOrdinaryIncome: number
  taxableSocialSecurity: number
  totalCapitalGains: number
  adjustedGrossIncome: number
  // Deductions
  deductionUsed: number
  deductionType: 'standard' | 'itemized'
  qbiDeduction: number
  enhancedSeniorDeduction: number // OBBB 2025-2028
  // Taxable Income
  taxableOrdinaryIncome: number
  taxableCapGains: number
  // Taxes
  ordinaryIncomeTax: number
  capitalGainsTax: number
  selfEmploymentTax: number
  niitTax: number
  additionalMedicareTax: number
  totalTaxBeforeCredits: number
  // Credits
  childTaxCredit: number
  // Final
  totalTax: number
  totalPayments: number
  amountDueOrRefund: number
  // Details for breakdown
  ordinaryTaxDetails: { bracket: string; amount: number; tax: number }[]
  capGainsTaxDetails: { bracket: string; amount: number; tax: number }[]
  seTaxDetails: { socialSecurityTax: number; medicareTax: number }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercent = (rate: number): string => {
  return `${(rate * 100).toFixed(0)}%`
}

export function TaxCalculator() {
  const printRef = useRef<HTMLDivElement>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [result, setResult] = useState<TaxResult | null>(null)

  const [input, setInput] = useState<TaxInput>({
    clientName: '',
    taxYear: 2025,
    filingStatus: 'single',
    childrenUnder17: 0,
    age65OrOlder: false,
    spouse65OrOlder: false,
    ordinaryIncome: 0,
    qualifiedDividends: 0,
    shortTermCapGains: 0,
    longTermCapGains: 0,
    selfEmploymentIncome: 0,
    socialSecurityIncome: 0,
    useStandardDeduction: true,
    itemizedDeductions: 0,
    isSSTB: false,
    withholding: 0,
    estimatedPayments: 0
  })

  const handleInputChange = (field: keyof TaxInput, value: string | number | boolean) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const handleNumberInput = (field: keyof TaxInput, value: string) => {
    const num = parseFloat(value.replace(/,/g, '')) || 0
    handleInputChange(field, num)
  }

  const calculateTax = () => {
    const taxData = TAX_DATA[input.taxYear]
    const status = input.filingStatus

    // Calculate taxable Social Security (up to 85%)
    const provisionalIncome = input.ordinaryIncome + input.qualifiedDividends +
      input.shortTermCapGains + input.longTermCapGains +
      (input.selfEmploymentIncome * 0.9235 * 0.5) + // Deduct half of SE tax
      (input.socialSecurityIncome * 0.5)

    const ssThresholds = status === 'mfj'
      ? { first: 32000, second: 44000 }
      : { first: 25000, second: 34000 }

    let taxableSS = 0
    if (provisionalIncome > ssThresholds.second) {
      taxableSS = Math.min(input.socialSecurityIncome * 0.85,
        (provisionalIncome - ssThresholds.second) * 0.85 +
        Math.min((ssThresholds.second - ssThresholds.first) * 0.5, input.socialSecurityIncome * 0.5))
    } else if (provisionalIncome > ssThresholds.first) {
      taxableSS = Math.min(input.socialSecurityIncome * 0.5,
        (provisionalIncome - ssThresholds.first) * 0.5)
    }

    // Total ordinary income (including taxable SS and short-term gains)
    const totalOrdinaryIncome = input.ordinaryIncome + taxableSS + input.shortTermCapGains

    // Self-employment tax calculation
    const seNetEarnings = input.selfEmploymentIncome * 0.9235
    const ssSETax = Math.min(seNetEarnings, taxData.ssWageBase) * 0.124
    const medicareSETax = seNetEarnings * 0.029
    const selfEmploymentTax = ssSETax + medicareSETax
    const seDeduction = selfEmploymentTax * 0.5

    // AGI
    const adjustedGrossIncome = totalOrdinaryIncome + input.qualifiedDividends +
      input.longTermCapGains + seNetEarnings - seDeduction

    // Standard vs Itemized deduction
    let standardDed = taxData.standardDeduction[status]
    if (input.age65OrOlder) {
      standardDed += taxData.additionalStdDeduction[status]
    }

    const deductionUsed = input.useStandardDeduction ? standardDed : input.itemizedDeductions
    const deductionType = input.useStandardDeduction ? 'standard' : 'itemized'

    // QBI Deduction calculation
    let qbiDeduction = 0
    if (input.selfEmploymentIncome > 0) {
      const qbiIncome = input.selfEmploymentIncome * 0.9235 - seDeduction
      const taxableIncomeBeforeQBI = adjustedGrossIncome - deductionUsed
      const qbiThreshold = taxData.qbiThreshold[status]
      const qbiPhaseout = taxData.qbiPhaseoutRange[status]

      if (input.isSSTB) {
        // SSTB: Full deduction below threshold, phased out above
        if (taxableIncomeBeforeQBI <= qbiThreshold) {
          qbiDeduction = qbiIncome * 0.20
        } else if (taxableIncomeBeforeQBI < qbiThreshold + qbiPhaseout) {
          const phaseoutPct = (taxableIncomeBeforeQBI - qbiThreshold) / qbiPhaseout
          qbiDeduction = qbiIncome * 0.20 * (1 - phaseoutPct)
        }
        // Above threshold + phaseout range: no QBI for SSTB
      } else {
        // Non-SSTB: Full deduction (simplified - ignoring wage/capital limitations)
        if (taxableIncomeBeforeQBI <= qbiThreshold) {
          qbiDeduction = qbiIncome * 0.20
        } else {
          // Above threshold: wage/capital limits apply (simplified to 50% of W-2 wages)
          // For simplicity, we'll still allow the deduction but could be limited
          qbiDeduction = qbiIncome * 0.20
        }
      }
      // QBI limited to 20% of taxable income
      qbiDeduction = Math.min(qbiDeduction, taxableIncomeBeforeQBI * 0.20)
      qbiDeduction = Math.max(qbiDeduction, 0)
    }

    // Enhanced Senior Deduction (OBBB 2025-2028)
    // Additional $6,000 per qualifying person 65+, phases out above $75k single/$150k MFJ
    let enhancedSeniorDeduction = 0
    if (input.taxYear >= 2025 && input.age65OrOlder) {
      const seniorDeductionPerPerson = 6000
      let numQualifyingSeniors = 1
      if (input.filingStatus === 'mfj' && input.spouse65OrOlder) {
        numQualifyingSeniors = 2
      }

      const baseDeduction = seniorDeductionPerPerson * numQualifyingSeniors
      const threshold = input.filingStatus === 'mfj' ? 150000 : 75000

      if (adjustedGrossIncome <= threshold) {
        enhancedSeniorDeduction = baseDeduction
      } else {
        // Phases out at 6 cents per $1 over threshold
        const phaseoutAmount = (adjustedGrossIncome - threshold) * 0.06
        enhancedSeniorDeduction = Math.max(0, baseDeduction - phaseoutAmount)
      }
    }

    // Taxable income
    const taxableIncome = Math.max(0, adjustedGrossIncome - deductionUsed - qbiDeduction - enhancedSeniorDeduction)

    // Split between ordinary and cap gains
    const totalCapGains = input.qualifiedDividends + input.longTermCapGains
    const taxableOrdinaryIncome = Math.max(0, taxableIncome - totalCapGains)
    const taxableCapGains = Math.min(totalCapGains, taxableIncome)

    // Calculate ordinary income tax
    const brackets = taxData.brackets[status]
    let ordinaryIncomeTax = 0
    const ordinaryTaxDetails: { bracket: string; amount: number; tax: number }[] = []
    let remainingIncome = taxableOrdinaryIncome

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break
      const bracketSize = bracket.max - bracket.min
      const taxableInBracket = Math.min(remainingIncome, bracketSize)
      const taxInBracket = taxableInBracket * bracket.rate
      ordinaryIncomeTax += taxInBracket

      if (taxableInBracket > 0) {
        ordinaryTaxDetails.push({
          bracket: `${formatPercent(bracket.rate)} (${formatCurrency(bracket.min)} - ${bracket.max === Infinity ? 'above' : formatCurrency(bracket.max)})`,
          amount: taxableInBracket,
          tax: taxInBracket
        })
      }
      remainingIncome -= taxableInBracket
    }

    // Calculate capital gains tax
    const capGainsBrackets = taxData.capGainsBrackets[status]
    let capitalGainsTax = 0
    const capGainsTaxDetails: { bracket: string; amount: number; tax: number }[] = []

    // Cap gains are stacked on top of ordinary income for bracket determination
    let incomeForCapGainsBracket = taxableOrdinaryIncome
    let remainingCapGains = taxableCapGains

    for (const bracket of capGainsBrackets) {
      if (remainingCapGains <= 0) break

      // How much room is left in this bracket after ordinary income
      const bracketTop = bracket.max
      const roomInBracket = Math.max(0, bracketTop - incomeForCapGainsBracket)
      const gainsInBracket = Math.min(remainingCapGains, roomInBracket)

      if (gainsInBracket > 0) {
        const taxInBracket = gainsInBracket * bracket.rate
        capitalGainsTax += taxInBracket

        capGainsTaxDetails.push({
          bracket: `${formatPercent(bracket.rate)} rate`,
          amount: gainsInBracket,
          tax: taxInBracket
        })

        remainingCapGains -= gainsInBracket
        incomeForCapGainsBracket += gainsInBracket
      }

      // If we haven't used all the bracket with ordinary income, move to it
      if (incomeForCapGainsBracket < bracket.max) {
        incomeForCapGainsBracket = bracket.max
      }
    }

    // NIIT (3.8% on investment income above threshold)
    const niitThreshold = taxData.niitThreshold[status]
    const investmentIncome = input.qualifiedDividends + input.shortTermCapGains +
      input.longTermCapGains + (input.ordinaryIncome * 0) // Only passive income, not wages
    const niitBase = Math.min(investmentIncome, Math.max(0, adjustedGrossIncome - niitThreshold))
    const niitTax = niitBase * 0.038

    // Additional Medicare Tax (0.9% on earnings above threshold)
    const medicareThreshold = taxData.additionalMedicareThreshold[status]
    const earningsForMedicare = input.ordinaryIncome + seNetEarnings
    const additionalMedicareTax = Math.max(0, earningsForMedicare - medicareThreshold) * 0.009

    // Total tax before credits
    const totalTaxBeforeCredits = ordinaryIncomeTax + capitalGainsTax +
      selfEmploymentTax + niitTax + additionalMedicareTax

    // Child Tax Credit
    const childTaxCredit = Math.min(
      input.childrenUnder17 * taxData.childTaxCredit,
      totalTaxBeforeCredits // Non-refundable portion limit (simplified)
    )

    // Final calculations
    const totalTax = Math.max(0, totalTaxBeforeCredits - childTaxCredit)
    const totalPayments = input.withholding + input.estimatedPayments
    const amountDueOrRefund = totalTax - totalPayments

    setResult({
      totalOrdinaryIncome,
      taxableSocialSecurity: taxableSS,
      totalCapitalGains: totalCapGains,
      adjustedGrossIncome,
      deductionUsed,
      deductionType,
      qbiDeduction,
      enhancedSeniorDeduction,
      taxableOrdinaryIncome,
      taxableCapGains,
      ordinaryIncomeTax,
      capitalGainsTax,
      selfEmploymentTax,
      niitTax,
      additionalMedicareTax,
      totalTaxBeforeCredits,
      childTaxCredit,
      totalTax,
      totalPayments,
      amountDueOrRefund,
      ordinaryTaxDetails,
      capGainsTaxDetails,
      seTaxDetails: { socialSecurityTax: ssSETax, medicareTax: medicareSETax }
    })

    toast.success("Tax calculation complete!")
  }

  const handlePrint = () => {
    window.print()
  }

  const clearForm = () => {
    setInput({
      clientName: '',
      taxYear: 2025,
      filingStatus: 'single',
      childrenUnder17: 0,
      age65OrOlder: false,
      spouse65OrOlder: false,
      ordinaryIncome: 0,
      qualifiedDividends: 0,
      shortTermCapGains: 0,
      longTermCapGains: 0,
      selfEmploymentIncome: 0,
      socialSecurityIncome: 0,
      useStandardDeduction: true,
      itemizedDeductions: 0,
      isSSTB: false,
      withholding: 0,
      estimatedPayments: 0
    })
    setResult(null)
    toast.info("Form cleared")
  }

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
                <Calculator className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Quick Tax Calculator</h1>
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
        {/* Print Header - only shows when printing */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">Tax Estimate - {input.taxYear}</h1>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Year</label>
                    <Select
                      value={input.taxYear.toString()}
                      onValueChange={(v) => handleInputChange('taxYear', parseInt(v) as TaxYear)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Filing Status</label>
                    <Select
                      value={input.filingStatus}
                      onValueChange={(v) => handleInputChange('filingStatus', v as FilingStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                        <SelectItem value="hoh">Head of Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Children Under 17</label>
                    <Input
                      type="number"
                      min="0"
                      value={input.childrenUnder17 || ''}
                      onChange={(e) => handleInputChange('childrenUnder17', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="age65"
                      checked={input.age65OrOlder}
                      onChange={(e) => handleInputChange('age65OrOlder', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="age65" className="text-sm cursor-pointer">
                      {input.filingStatus === 'mfj' ? 'Taxpayer age 65+' : 'Age 65 or older'}
                    </label>
                  </div>
                </div>
                {/* Spouse 65+ checkbox - only for MFJ */}
                {input.filingStatus === 'mfj' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="spouse65"
                      checked={input.spouse65OrOlder}
                      onChange={(e) => handleInputChange('spouse65OrOlder', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="spouse65" className="text-sm cursor-pointer">Spouse age 65+</label>
                  </div>
                )}
                {/* Enhanced Senior Deduction note */}
                {input.taxYear >= 2025 && input.age65OrOlder && (
                  <p className="text-xs text-muted-foreground mt-2">
                    * Eligible for Enhanced Senior Deduction ($6,000{input.filingStatus === 'mfj' && input.spouse65OrOlder ? ' x 2' : ''} - phases out above {input.filingStatus === 'mfj' ? '$150,000' : '$75,000'} AGI)
                  </p>
                )}
              </div>
            </Card>

            {/* Income */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Income
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ordinary Income (Wages, Interest, Non-Qualified Dividends, Rents, Royalties)
                  </label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={input.ordinaryIncome ? input.ordinaryIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('ordinaryIncome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Qualified Dividends</label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={input.qualifiedDividends ? input.qualifiedDividends.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('qualifiedDividends', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Short-Term Capital Gains</label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={input.shortTermCapGains ? input.shortTermCapGains.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('shortTermCapGains', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Long-Term Capital Gains</label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={input.longTermCapGains ? input.longTermCapGains.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('longTermCapGains', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Self-Employment Income (Net)</label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={input.selfEmploymentIncome ? input.selfEmploymentIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('selfEmploymentIncome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Social Security Benefits</label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={input.socialSecurityIncome ? input.socialSecurityIncome.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('socialSecurityIncome', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Deductions */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Deductions
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useStandard"
                    checked={input.useStandardDeduction}
                    onChange={(e) => handleInputChange('useStandardDeduction', e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="useStandard" className="text-sm cursor-pointer">
                    Use Standard Deduction ({formatCurrency(TAX_DATA[input.taxYear].standardDeduction[input.filingStatus])}
                    {input.age65OrOlder && ` + ${formatCurrency(TAX_DATA[input.taxYear].additionalStdDeduction[input.filingStatus])} for 65+`})
                  </label>
                </div>
                {!input.useStandardDeduction && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Itemized Deductions (Total)</label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={input.itemizedDeductions ? input.itemizedDeductions.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('itemizedDeductions', e.target.value)}
                    />
                  </div>
                )}
                {input.selfEmploymentIncome > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">QBI Deduction (20%)</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sstb"
                        checked={input.isSSTB}
                        onChange={(e) => handleInputChange('isSSTB', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="sstb" className="text-sm cursor-pointer">
                        Specified Service Trade or Business (Doctor, Attorney, CPA, etc.)
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      SSTB deduction phases out above {formatCurrency(TAX_DATA[input.taxYear].qbiThreshold[input.filingStatus])}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Payments */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payments
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Federal Withholding</label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={input.withholding ? input.withholding.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('withholding', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Tax Payments</label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={input.estimatedPayments ? input.estimatedPayments.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('estimatedPayments', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={calculateTax} className="flex-1">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Tax
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
                {/* Summary Card */}
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-4">Tax Summary - {input.taxYear}</h2>
                  {input.clientName && (
                    <p className="text-muted-foreground mb-4">Client: {input.clientName}</p>
                  )}

                  {/* Income Section */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase">Income</h3>
                    <div className="flex justify-between">
                      <span>Ordinary Income</span>
                      <span>{formatCurrency(input.ordinaryIncome)}</span>
                    </div>
                    {input.qualifiedDividends > 0 && (
                      <div className="flex justify-between">
                        <span>Qualified Dividends</span>
                        <span>{formatCurrency(input.qualifiedDividends)}</span>
                      </div>
                    )}
                    {input.shortTermCapGains > 0 && (
                      <div className="flex justify-between">
                        <span>Short-Term Capital Gains</span>
                        <span>{formatCurrency(input.shortTermCapGains)}</span>
                      </div>
                    )}
                    {input.longTermCapGains > 0 && (
                      <div className="flex justify-between">
                        <span>Long-Term Capital Gains</span>
                        <span>{formatCurrency(input.longTermCapGains)}</span>
                      </div>
                    )}
                    {input.selfEmploymentIncome > 0 && (
                      <div className="flex justify-between">
                        <span>Self-Employment Income</span>
                        <span>{formatCurrency(input.selfEmploymentIncome)}</span>
                      </div>
                    )}
                    {input.socialSecurityIncome > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Social Security Benefits</span>
                          <span>{formatCurrency(input.socialSecurityIncome)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground pl-4">
                          <span>Taxable Portion</span>
                          <span>{formatCurrency(result.taxableSocialSecurity)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Adjusted Gross Income</span>
                      <span>{formatCurrency(result.adjustedGrossIncome)}</span>
                    </div>
                  </div>

                  {/* Deductions Section */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase">Deductions</h3>
                    <div className="flex justify-between">
                      <span>{result.deductionType === 'standard' ? 'Standard Deduction' : 'Itemized Deductions'}</span>
                      <span>({formatCurrency(result.deductionUsed)})</span>
                    </div>
                    {result.qbiDeduction > 0 && (
                      <div className="flex justify-between">
                        <span>QBI Deduction (20%)</span>
                        <span>({formatCurrency(result.qbiDeduction)})</span>
                      </div>
                    )}
                    {result.enhancedSeniorDeduction > 0 && (
                      <div className="flex justify-between">
                        <span>Enhanced Senior Deduction</span>
                        <span>({formatCurrency(result.enhancedSeniorDeduction)})</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Taxable Income</span>
                      <span>{formatCurrency(result.taxableOrdinaryIncome + result.taxableCapGains)}</span>
                    </div>
                  </div>

                  {/* Tax Section */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase">Tax Calculation</h3>
                    <div className="flex justify-between">
                      <span>Tax on Ordinary Income</span>
                      <span>{formatCurrency(result.ordinaryIncomeTax)}</span>
                    </div>
                    {result.capitalGainsTax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax on Capital Gains/Dividends</span>
                        <span>{formatCurrency(result.capitalGainsTax)}</span>
                      </div>
                    )}
                    {result.selfEmploymentTax > 0 && (
                      <div className="flex justify-between">
                        <span>Self-Employment Tax</span>
                        <span>{formatCurrency(result.selfEmploymentTax)}</span>
                      </div>
                    )}
                    {result.niitTax > 0 && (
                      <div className="flex justify-between">
                        <span>Net Investment Income Tax (3.8%)</span>
                        <span>{formatCurrency(result.niitTax)}</span>
                      </div>
                    )}
                    {result.additionalMedicareTax > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Medicare Tax (0.9%)</span>
                        <span>{formatCurrency(result.additionalMedicareTax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Tax Before Credits</span>
                      <span>{formatCurrency(result.totalTaxBeforeCredits)}</span>
                    </div>
                    {result.childTaxCredit > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Child Tax Credit</span>
                        <span>({formatCurrency(result.childTaxCredit)})</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Tax</span>
                      <span>{formatCurrency(result.totalTax)}</span>
                    </div>
                  </div>

                  {/* Payments Section */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase">Payments</h3>
                    {input.withholding > 0 && (
                      <div className="flex justify-between">
                        <span>Federal Withholding</span>
                        <span>{formatCurrency(input.withholding)}</span>
                      </div>
                    )}
                    {input.estimatedPayments > 0 && (
                      <div className="flex justify-between">
                        <span>Estimated Tax Payments</span>
                        <span>{formatCurrency(input.estimatedPayments)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Payments</span>
                      <span>{formatCurrency(result.totalPayments)}</span>
                    </div>
                  </div>

                  {/* Final Result */}
                  <div className={`p-4 rounded-lg ${result.amountDueOrRefund > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                    <div className="flex justify-between text-xl font-bold">
                      <span>{result.amountDueOrRefund > 0 ? 'Amount Due' : 'Refund'}</span>
                      <span className={result.amountDueOrRefund > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(Math.abs(result.amountDueOrRefund))}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Expandable Details */}
                <Card className="p-4 print:break-before-page">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between text-lg font-semibold print:hidden"
                  >
                    <span>Calculation Details</span>
                    {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <h2 className="text-lg font-semibold hidden print:block mb-4">Calculation Details</h2>

                  {(showDetails || true) && (
                    <div className={`mt-4 space-y-4 ${!showDetails ? 'hidden print:block' : ''}`}>
                      {/* Ordinary Income Tax Breakdown */}
                      {result.ordinaryTaxDetails.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Ordinary Income Tax by Bracket</h4>
                          <div className="text-sm space-y-1">
                            {result.ordinaryTaxDetails.map((detail, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{formatCurrency(detail.amount)} @ {detail.bracket}</span>
                                <span>{formatCurrency(detail.tax)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Capital Gains Tax Breakdown */}
                      {result.capGainsTaxDetails.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Capital Gains Tax by Rate</h4>
                          <div className="text-sm space-y-1">
                            {result.capGainsTaxDetails.map((detail, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{formatCurrency(detail.amount)} @ {detail.bracket}</span>
                                <span>{formatCurrency(detail.tax)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SE Tax Breakdown */}
                      {result.selfEmploymentTax > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Self-Employment Tax Breakdown</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Social Security (12.4%)</span>
                              <span>{formatCurrency(result.seTaxDetails.socialSecurityTax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medicare (2.9%)</span>
                              <span>{formatCurrency(result.seTaxDetails.medicareTax)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center">
                  This is an estimate only. Consult a tax professional for accurate tax advice.
                  Tax laws are subject to change.
                </p>
              </>
            ) : (
              <Card className="p-8 text-center">
                <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Enter Information to Calculate</h3>
                <p className="text-muted-foreground">
                  Fill in the client information and income details on the left, then click "Calculate Tax" to see the results.
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
          .print\\:break-before-page {
            break-before: page;
          }
        }
      `}</style>
    </div>
  )
}
