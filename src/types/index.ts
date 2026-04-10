export type CompanyType = 'sender' | 'client'

export interface CompanyContact {
  id: string
  company_id: string
  name: string
  phone: string | null
  created_at: string
}

export interface Company {
  id: string
  company_type: CompanyType
  name: string
  address: string | null
  phone: string | null
  business_no: string | null
  business_type: string | null
  business_item: string | null
  email: string | null
  fax: string | null
  created_at: string
  contacts?: CompanyContact[]
}

export interface QuotationItem {
  id?: string
  quotation_id?: string
  sort_order: number
  category: string
  item_name: string
  period: number
  unit_price: number
  total_price: number
  note: string
}

export type VatType = 'excluded' | 'included' | 'none'
export type QuotationStatus = 'draft' | 'saved'

export interface Quotation {
  id: string
  company_id: string | null
  quote_date: string
  recipient: string
  total_amount: number
  vat_type: VatType
  status: QuotationStatus
  period: number
  created_at: string
  companies?: { name: string } | null
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[]
  companies: Company | null
}

export type ContractStatus = 'draft' | 'signed'

export interface ContractItem {
  id?: string
  contract_id?: string
  sort_order: number
  category: string
  item_name: string
  period: number
  unit_price: number
  total_price: number
  note: string
}

export interface Contract {
  id: string
  quotation_id: string | null
  company_id: string | null
  contract_date: string
  start_date: string | null
  end_date: string | null
  recipient: string
  total_amount: number
  vat_type: VatType
  status: ContractStatus
  special_terms: string | null
  created_at: string
  companies?: { name: string } | null
}

export interface ContractWithItems extends Contract {
  items: ContractItem[]
  companies: Company | null
}
