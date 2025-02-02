'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Heart, Twitter, Linkedin } from 'lucide-react'; // Add these imports


const TaxCalculator = () => {
  // ... [Previous state and constants remain the same] ...
  interface TaxCalculation {
    totalTax: number;
    effectiveRate: string;
    breakdown: {
      slab: string;
      rate: string;
      taxableAmount: number;
      tax: number;
    }[];
    takeHome: number;
    taxableIncome: number;
    basicExemption: number;
    standardDeduction: number;
    cessAmount: number;
    totalTaxWithCess: number;
    rebateAmount: number;
    excessAboveRebateLimit: number;
    surchargeAmount: number;
    marginalRelief: number;
    totalTaxWithSurcharge: number;
  }


  interface TaxBreakdownProps {
    details: TaxCalculation;
    title: string;
    className?: string;
  }
  
  
  interface TaxDetails {
    old: TaxCalculation | null;
    new: TaxCalculation | null;
  }
  const [income, setIncome] = useState('');
  const [taxDetails, setTaxDetails] = useState<TaxDetails>({ old: null, new: null });
  
  

  interface TaxSlab {
    min: number;
    max: number;
    rate: number;
  }

  const SURCHARGE_SLABS = [
    { min: 5000000, max: 10000000, rate: 0.10 },  // 50L to 1Cr
    { min: 10000000, max: 20000000, rate: 0.15 }, // 1Cr to 2Cr
    { min: 20000000, max: 50000000, rate: 0.25 }, // 2Cr to 5Cr
    { min: 50000000, max: Infinity, rate: 0.37 }  // Above 5Cr
  ];

  const oldTaxSlabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 0.05 },
    { min: 700000, max: 1000000, rate: 0.10 },
    { min: 1000000, max: 1200000, rate: 0.15 },
    { min: 1200000, max: 1500000, rate: 0.20 },
    { min: 1500000, max: Infinity, rate: 0.30 }
  ];
  
  const newTaxSlabs = [
    { min: 0, max: 400000, rate: 0 },
    { min: 400000, max: 800000, rate: 0.05 },
    { min: 800000, max: 1200000, rate: 0.10 },
    { min: 1200000, max: 1600000, rate: 0.15 },
    { min: 1600000, max: 2000000, rate: 0.20 },
    { min: 2000000, max: 2400000, rate: 0.25 },
    { min: 2400000, max: Infinity, rate: 0.30 }
  ];

  const OLD_STANDARD_DEDUCTION = 50000;
  const NEW_STANDARD_DEDUCTION = 75000;
  const OLD_REBATE_LIMIT = 700000;
  const NEW_REBATE_LIMIT = 1200000;
  const CESS_RATE = 0.04;

  const calculateSurcharge = (taxBeforeCess: number, totalIncome: number) => {
    if (totalIncome < 5000000) return 0; // No surcharge below 50L
    
    let surchargeRate = 0;
    for (const slab of SURCHARGE_SLABS) {
      if (totalIncome > slab.min) {
        surchargeRate = slab.rate;
      }
    }
    
    return taxBeforeCess * surchargeRate;
  };
  

  const calculateMarginalRelief = (taxBeforeCess: number, surcharge: number, totalIncome: number) => {
    if (totalIncome <= 5000000) return 0;
  
    let relief = 0;
    
    // For income between 50L to 1Cr
    if (totalIncome > 5000000 && totalIncome <= 10000000) {
      const excess = totalIncome - 5000000;
      const taxWithSurcharge = taxBeforeCess + surcharge;
      const taxAt50L = (taxBeforeCess * 5000000) / totalIncome;
      if (taxWithSurcharge - taxAt50L > excess) {
        relief = taxWithSurcharge - taxAt50L - excess;
      }
    }
    
    // For income between 1Cr to 2Cr
    else if (totalIncome > 10000000 && totalIncome <= 20000000) {
      const excess = totalIncome - 10000000;
      const taxWithSurcharge = taxBeforeCess + surcharge;
      const taxAt1Cr = (taxBeforeCess * 10000000) / totalIncome;
      const surchargeAt1Cr = taxAt1Cr * 0.10;
      if (taxWithSurcharge - (taxAt1Cr + surchargeAt1Cr) > excess) {
        relief = taxWithSurcharge - (taxAt1Cr + surchargeAt1Cr) - excess;
      }
    }
    
    // For income between 2Cr to 5Cr
    else if (totalIncome > 20000000 && totalIncome <= 50000000) {
      const excess = totalIncome - 20000000;
      const taxWithSurcharge = taxBeforeCess + surcharge;
      const taxAt2Cr = (taxBeforeCess * 20000000) / totalIncome;
      const surchargeAt2Cr = taxAt2Cr * 0.15; // 15% surcharge at 2Cr
      if (taxWithSurcharge - (taxAt2Cr + surchargeAt2Cr) > excess) {
        relief = taxWithSurcharge - (taxAt2Cr + surchargeAt2Cr) - excess;
      }
    }
    
    // For income above 5Cr
    else if (totalIncome > 50000000) {
      const excess = totalIncome - 50000000;
      const taxWithSurcharge = taxBeforeCess + surcharge;
      const taxAt5Cr = (taxBeforeCess * 50000000) / totalIncome;
      const surchargeAt5Cr = taxAt5Cr * 0.25; // 25% surcharge at 5Cr
      if (taxWithSurcharge - (taxAt5Cr + surchargeAt5Cr) > excess) {
        relief = taxWithSurcharge - (taxAt5Cr + surchargeAt5Cr) - excess;
      }
    }
  
    return relief;
  };
  
  
  
  
  const calculateTax = (income: number, slabs: TaxSlab[]) => {
    // Apply standard deduction first
    const standardDeduction = slabs === oldTaxSlabs ? OLD_STANDARD_DEDUCTION : NEW_STANDARD_DEDUCTION;
    const incomeAfterStandardDeduction = Math.max(0, income - standardDeduction);
    const rebateLimit = slabs === oldTaxSlabs ? OLD_REBATE_LIMIT : NEW_REBATE_LIMIT;
    
    // Calculate excess above rebate limit
    const excessAboveRebateLimit = Math.max(0, incomeAfterStandardDeduction - rebateLimit);
    
    // Calculate total tax
    let totalTax = 0;
    let remainingIncome = incomeAfterStandardDeduction;
    const breakdown = [];
  
    for (const slab of slabs) {
      if (remainingIncome <= 0) break;
  
      const taxableInThisSlab = Math.min(
        remainingIncome,
        slab.max - slab.min
      );
  
      if (taxableInThisSlab > 0) {
        const taxInThisSlab = taxableInThisSlab * slab.rate;
        totalTax += taxInThisSlab;
        
        breakdown.push({
          slab: `${(slab.min/100000).toFixed(1)}-${slab.max === Infinity ? '∞' : (slab.max/100000).toFixed(1)} lakh`,
          rate: `${slab.rate * 100}%`,
          taxableAmount: taxableInThisSlab,
          tax: taxInThisSlab
        });
      }
  
      remainingIncome -= (slab.max - slab.min);
    }
  
    // Apply rebate logic
    let finalTax = totalTax;
    let rebateAmount = 0;
    
    if (incomeAfterStandardDeduction <= rebateLimit) {
      finalTax = 0;
      rebateAmount = totalTax;
    } else if (totalTax > excessAboveRebateLimit) {
      // If tax is more than excess income, limit it to excess amount
      rebateAmount = totalTax - excessAboveRebateLimit;
      finalTax = excessAboveRebateLimit;
    }
  
    // Apply cess
    const cessAmount = finalTax * CESS_RATE;
    const totalTaxWithCess = finalTax + cessAmount;
    const surchargeAmount = calculateSurcharge(finalTax, income);
    const marginalRelief = calculateMarginalRelief(finalTax, surchargeAmount, income);
    const finalSurcharge = Math.max(0, surchargeAmount - marginalRelief);
    const totalTaxWithSurcharge = finalTax + finalSurcharge + cessAmount;
  
    return {
      totalTax: finalTax,
      cessAmount,
      totalTaxWithCess,
      effectiveRate: ((totalTaxWithCess / income) * 100).toFixed(2),
      breakdown,
      takeHome: income - totalTaxWithCess,
      taxableIncome: incomeAfterStandardDeduction,
      basicExemption: slabs[0].max,
      standardDeduction,
      rebateAmount,
      excessAboveRebateLimit,
      surchargeAmount: finalSurcharge,
      marginalRelief,
      totalTaxWithSurcharge
    };
  };
  
  
  

  const handleCalculate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIncome(value);
    
    if (value && !isNaN(Number(value)) && Number(value) > 0) {
        const oldRegime = calculateTax(Number(value), oldTaxSlabs);
      const newRegime = calculateTax(Number(value), newTaxSlabs);
      setTaxDetails({ old: oldRegime, new: newRegime });
    } else {
      setTaxDetails({ old: null, new: null });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const Header = () => (
    <div className="text-center space-y-2 mb-6">
      <p className="text-xl italic text-gray-700">
        "The hardest thing in the world to understand is income tax"
        <span className="text-sm block">- Albert Einstein</span>
      </p>
      <p className="text-sm text-gray-500">
        Disclaimer: This calculator is based on my best understanding of tax rules. Even Einstein couldn't understand taxes completely.
      </p>
    </div>
  );

  const TaxSavingsCard = ({ oldTax, newTax }: { oldTax: number, newTax: number }) => {
    const savings = oldTax - newTax;
    const percentageSavings = ((savings / oldTax) * 100).toFixed(1);
    
    return (
      <Card className="bg-green-50 border-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-green-700">Tax Savings in 2025</h3>
              <p className="text-sm text-green-600">Compared to 2024 regime</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-700">
                {formatCurrency(Math.abs(savings))}
              </span>
              {savings > 0 ? (
                <ArrowDown className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowUp className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-green-600">
              {savings > 0 
                ? `You save ${percentageSavings}% on your tax payment`
                : `Tax payment increases by ${percentageSavings}%`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaxBreakdown = ({ details, title, className }: TaxBreakdownProps) => {
    const isNewRegime = title.includes("2025");
    const rebateLimit = isNewRegime ? NEW_REBATE_LIMIT : OLD_REBATE_LIMIT;
  
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Income Calculation Section */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gross Income</span>
                <span className="text-sm font-medium">{formatCurrency(Number(income))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Standard Deduction</span>
                <span className="text-sm font-medium">- {formatCurrency(details.standardDeduction)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-sm font-semibold">Taxable Income</span>
                <span className="text-sm font-semibold">{formatCurrency(details.taxableIncome)}</span>
              </div>
            </div>
  
            {/* Tax Calculation Section */}
            <div className="space-y-2">
              <p className="font-medium">Tax Calculation</p>
              <div className="space-y-2">
                {details.breakdown.map((item, index) => (
                  item.tax > 0 && (
                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {item.slab} @ {item.rate}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.tax)}
                      </span>
                    </div>
                  )
                ))}
                
                <div className="border-t border-gray-200 mt-2 pt-2">
                  {/* Initial Tax Calculation */}
                  {details.rebateAmount > 0 && (
                    <>
                      <div className="flex justify-between p-2">
                        <span className="text-sm">Initial Tax</span>
                        <span className="text-sm">{formatCurrency(details.totalTax + details.rebateAmount)}</span>
                      </div>
                      <div className="flex justify-between p-2 text-green-600">
                        <span className="text-sm">Tax Rebate</span>
                        <span className="text-sm">- {formatCurrency(details.rebateAmount)}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Tax before Surcharge */}
                  <div className="flex justify-between p-2">
                    <span className="text-sm">Tax before Surcharge</span>
                    <span className="text-sm">{formatCurrency(details.totalTax)}</span>
                  </div>
  
                  {/* Surcharge Section - Only show if applicable */}
                  {details.surchargeAmount > 0 && (
                    <>
                      <div className="flex justify-between p-2">
                        <span className="text-sm">Surcharge</span>
                        <span className="text-sm">{formatCurrency(details.surchargeAmount)}</span>
                      </div>
                      {details.marginalRelief > 0 && (
                        <div className="flex justify-between p-2 text-green-600">
                          <span className="text-sm">Marginal Relief</span>
                          <span className="text-sm">- {formatCurrency(details.marginalRelief)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Cess Calculation */}
                  <div className="flex justify-between p-2">
                    <span className="text-sm">Health & Education Cess @ 4%</span>
                    <span className="text-sm">{formatCurrency(details.cessAmount)}</span>
                  </div>
  
                  {/* Final Tax Amount */}
                  <div className="flex justify-between p-2 bg-gray-100 font-semibold rounded mt-2">
                    <span>Final Tax</span>
                    <span>{formatCurrency(details.totalTaxWithSurcharge)}</span>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Summary Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Take Home</p>
                <p className="text-lg font-semibold">{formatCurrency(details.takeHome)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Effective Tax Rate</p>
                <p className="text-lg font-semibold">{details.effectiveRate}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  
const Footer = () => (
    <footer className="py-6 text-center text-sm text-gray-600 space-y-2">
      <div className="flex items-center justify-center gap-1">
        Built with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> in Lucknow
      </div>
      <div className="flex items-center justify-center gap-4">
        <a 
          href="https://www.linkedin.com/in/captainashu/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <Linkedin className="h-4 w-4" />
          Connect on LinkedIn
        </a>
        <a 
          href="https://twitter.com/captAshutosh" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <Twitter className="h-4 w-4" />
          @captAshutosh
        </a>
      </div>
    </footer>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
        <Header />
      <Card>
        <CardHeader>
          <CardTitle>Income Tax Calculator (2024 vs 2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="income">Annual Income (₹)</Label>
            <Input
              id="income"
              type="number"
              value={income}
              onChange={handleCalculate}
              placeholder="Enter your annual income"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {taxDetails.old && taxDetails.new && (
        <div className="space-y-6">
          <TaxSavingsCard 
            oldTax={taxDetails.old.totalTax} 
            newTax={taxDetails.new.totalTax}
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            <TaxBreakdown 
              details={taxDetails.old} 
              title="2024 Tax Regime" 
              className={taxDetails.old.totalTax <= taxDetails.new.totalTax ? "border-green-500" : ""}
            />
            <TaxBreakdown 
              details={taxDetails.new} 
              title="2025 Tax Regime"
              className={taxDetails.new.totalTax < taxDetails.old.totalTax ? "border-green-500" : ""}
            />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TaxCalculator;