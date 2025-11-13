"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { DollarSign, TrendingUp, CreditCard, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { requestWithdrawal, validatePhone } from "@/lib/payment-api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal"
  amount: number
  netAmount?: number
  fee?: number
  date: string
  description: string
  currency?: string
  msisdn?: string
  internalReference?: string
}

export function WalletManagement() {
  const { toast } = useToast()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawing, setWithdrawing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const walletDoc = await getDoc(doc(db, "wallet", "admin"))
      if (walletDoc.exists()) {
        setBalance(walletDoc.data().balance || 0)
      } else {
        await setDoc(doc(db, "wallet", "admin"), { balance: 0, currency: "UGX" })
      }

      const transactionsQuery = query(collection(db, "transactions"), orderBy("date", "desc"))
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const transactionsList: Transaction[] = transactionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[]
      setTransactions(transactionsList)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount)
    const relworxFee = amount * 0.2
    const netAmount = amount - relworxFee

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      })
      return
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough balance to withdraw UGX ${amount.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    if (!phoneNumber || !phoneNumber.startsWith("+256")) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Ugandan phone number starting with +256",
        variant: "destructive",
      })
      return
    }

    setWithdrawing(true)
    try {
      console.log("[v0] Validating phone number:", phoneNumber)
      const validation = await validatePhone(phoneNumber)
      if (!validation.success) {
        toast({
          title: "Invalid Phone Number",
          description: validation.message || "Phone number validation failed",
          variant: "destructive",
        })
        setWithdrawing(false)
        return
      }

      console.log("[v0] Requesting withdrawal of UGX", netAmount, "to", phoneNumber)
      const withdrawalResponse = await requestWithdrawal(
        phoneNumber,
        netAmount,
        `Admin withdrawal (Amount: UGX ${amount.toLocaleString()}, Fee: UGX ${relworxFee.toLocaleString()})`,
      )

      console.log("[v0] Withdrawal response:", withdrawalResponse)

      if (!withdrawalResponse.success) {
        toast({
          title: "Withdrawal Failed",
          description:
            withdrawalResponse.relworx?.message || withdrawalResponse.message || "Failed to process withdrawal",
          variant: "destructive",
        })
        setWithdrawing(false)
        return
      }

      const newBalance = balance - amount
      await setDoc(doc(db, "wallet", "admin"), { balance: newBalance, currency: "UGX" })

      await addDoc(collection(db, "transactions"), {
        type: "withdrawal",
        amount: amount,
        netAmount: netAmount,
        fee: relworxFee,
        currency: "UGX",
        date: new Date().toISOString(),
        description: `Withdrawal to ${phoneNumber}`,
        msisdn: phoneNumber,
        internalReference: withdrawalResponse.relworx?.internal_reference || withdrawalResponse.reference,
      })

      toast({
        title: "Withdrawal Initiated!",
        description: `Withdrawal of UGX ${netAmount.toLocaleString()} initiated. Fee: UGX ${relworxFee.toLocaleString()}`,
      })

      setWithdrawAmount("")
      setPhoneNumber("")
      fetchWalletData()
    } catch (error) {
      console.error("[v0] Error withdrawing:", error)
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive",
      })
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const previewAmount = Number.parseFloat(withdrawAmount) || 0
  const previewFee = previewAmount * 0.2
  const previewNet = previewAmount - previewFee

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX{" "}
              {transactions
                .filter((t) => t.type === "withdrawal")
                .reduce((sum, t) => sum + (t.amount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime withdrawals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>Transfer money from your wallet to your mobile money account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Money Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+256701234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter your MTN or Airtel Uganda number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (UGX)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            {previewAmount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Withdrawal Amount:</span>
                      <span className="font-semibold">UGX {previewAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Relworx Fee (20%):</span>
                      <span className="font-semibold">- UGX {previewFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-semibold">You will receive:</span>
                      <span className="font-bold text-green-600">UGX {previewNet.toLocaleString()}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleWithdraw} disabled={withdrawing || !phoneNumber || !withdrawAmount}>
              {withdrawing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Withdraw
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium capitalize">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date ? (
                        <>
                          {new Date(transaction.date).toLocaleDateString()} at{" "}
                          {new Date(transaction.date).toLocaleTimeString()}
                        </>
                      ) : (
                        "Date unavailable"
                      )}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"}`}
                  >
                    {transaction.type === "withdrawal" ? "-" : "+"}UGX {(transaction.amount || 0).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
