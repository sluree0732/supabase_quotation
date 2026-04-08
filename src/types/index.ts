export interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  business_no: string | null
  business_type: string | null
  business_item: string | null
  created_at: string
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
  created_at: string
  companies?: { name: string } | null
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[]
  companies: Company | null
}
