import dotenv from "dotenv"
dotenv.config()

export const env = {
  databaseUrl: process.env.DATABASE_URL || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  defaultClinicName: process.env.DEFAULT_CLINIC_NAME || "Clínica Exemplo",
  billingDueDay: Number(process.env.BILLING_DUE_DAY || "5"),
}
