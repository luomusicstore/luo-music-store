const BASE_URL = "https://lucky-sun-a4fc.globalnexussystem-tech.workers.dev"

export interface PaymentResponse {
  success: boolean
  message?: string
  relworx?: {
    success?: boolean
    message?: string
    error_code?: string
    internal_reference?: string
  }
  reference?: string
  data?: {
    internal_reference?: string
    status?: string
    transaction_id?: string
    message?: string
  }
  error?: string
}

export interface PaymentCallbackResponse {
  success: boolean
  status?: string
  message?: string
  customer_reference?: string
  internal_reference?: string
  msisdn?: string
  amount?: number
  currency?: string
  provider?: string
  charge?: number
  request_status?: string
  remote_ip?: string
  provider_transaction_id?: string
  completed_at?: string
}

export async function callAPI(endpoint: string, bodyData: any): Promise<PaymentResponse> {
  const url = `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    })

    const data = await response.json()
    return data
  } catch (err: any) {
    console.error("API Error:", err)
    return { success: false, error: err.message }
  }
}

export async function requestPayment(msisdn: string, amount: number, description: string): Promise<PaymentResponse> {
  return callAPI("/api/deposit", { msisdn, amount, description })
}

export async function checkRequestStatus(internalReference: string): Promise<PaymentCallbackResponse> {
  const url = `${BASE_URL}/api/request-status?internal_reference=${internalReference}`

  try {
    const response = await fetch(url)
    return await response.json()
  } catch (err: any) {
    console.error("Status API Error:", err)
    return { success: false, message: err.message }
  }
}

export async function validatePhone(msisdn: string): Promise<PaymentResponse> {
  return callAPI("/api/validate-phone", { msisdn })
}

export async function requestWithdrawal(msisdn: string, amount: number, description: string): Promise<PaymentResponse> {
  return callAPI("/api/withdraw", { msisdn, amount, description })
}
