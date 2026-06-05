export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      absences: {
        Row: {
          anexo_url: string | null
          created_at: string
          employee_id: string
          fim: string
          id: string
          inicio: string
          motivo: string | null
          status: Database["public"]["Enums"]["absence_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["absence_type"]
          updated_at: string
        }
        Insert: {
          anexo_url?: string | null
          created_at?: string
          employee_id: string
          fim: string
          id?: string
          inicio: string
          motivo?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          tenant_id: string
          tipo?: Database["public"]["Enums"]["absence_type"]
          updated_at?: string
        }
        Update: {
          anexo_url?: string | null
          created_at?: string
          employee_id?: string
          fim?: string
          id?: string
          inicio?: string
          motivo?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["absence_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_payable: {
        Row: {
          account_id: string | null
          bank_account_id: string | null
          cost_center_id: string | null
          created_at: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          observacoes: string | null
          pago_em: string | null
          recorrencia: Database["public"]["Enums"]["recurrence"]
          status: Database["public"]["Enums"]["finance_status"]
          supplier_id: string | null
          tenant_id: string
          updated_at: string
          valor: number
          valor_pago: number
          vencimento: string
        }
        Insert: {
          account_id?: string | null
          bank_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          recorrencia?: Database["public"]["Enums"]["recurrence"]
          status?: Database["public"]["Enums"]["finance_status"]
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string
        }
        Update: {
          account_id?: string | null
          bank_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          recorrencia?: Database["public"]["Enums"]["recurrence"]
          status?: Database["public"]["Enums"]["finance_status"]
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          bank_account_id: string | null
          client_id: string | null
          contract_id: string | null
          created_at: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          observacoes: string | null
          os_id: string | null
          pago_em: string | null
          status: Database["public"]["Enums"]["finance_status"]
          tenant_id: string
          updated_at: string
          valor: number
          valor_pago: number
          vencimento: string
        }
        Insert: {
          bank_account_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          os_id?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["finance_status"]
          tenant_id: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string
        }
        Update: {
          bank_account_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          os_id?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["finance_status"]
          tenant_id?: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          ip: unknown
          new_values: Json | null
          old_values: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          ativo: boolean
          banco: string | null
          created_at: string
          id: string
          nome: string
          saldo_inicial: number
          tenant_id: string
          tipo: Database["public"]["Enums"]["bank_account_type"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          banco?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_inicial?: number
          tenant_id: string
          tipo?: Database["public"]["Enums"]["bank_account_type"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          banco?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["bank_account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          ar_id: string | null
          client_id: string | null
          created_at: string
          id: string
          invoice_url: string | null
          pix_payload: string | null
          provider: string
          provider_charge_id: string | null
          status: Database["public"]["Enums"]["charge_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["charge_type"]
          updated_at: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          ar_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          invoice_url?: string | null
          pix_payload?: string | null
          provider?: string
          provider_charge_id?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
          tenant_id: string
          tipo?: Database["public"]["Enums"]["charge_type"]
          updated_at?: string
          valor?: number
          vencimento?: string | null
        }
        Update: {
          ar_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          invoice_url?: string | null
          pix_payload?: string | null
          provider?: string
          provider_charge_id?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["charge_type"]
          updated_at?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charges_ar_id_fkey"
            columns: ["ar_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          id: string
          nome: string
          parent_id: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
          parent_id?: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
          parent_id?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          client_id: string
          created_at: string
          id: string
          mensagem: string
          status: Database["public"]["Enums"]["request_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          mensagem: string
          status?: Database["public"]["Enums"]["request_status"]
          tenant_id: string
          tipo?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          mensagem?: string
          status?: Database["public"]["Enums"]["request_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_units: {
        Row: {
          apelido: string
          area_m2: number | null
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          client_id: string
          complemento: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          logradouro: string | null
          numero: string | null
          tenant_id: string
          tipo_ambiente: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          apelido: string
          area_m2?: number | null
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          client_id: string
          complemento?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          logradouro?: string | null
          numero?: string | null
          tenant_id: string
          tipo_ambiente?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          apelido?: string
          area_m2?: number | null
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          client_id?: string
          complemento?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          logradouro?: string | null
          numero?: string | null
          tenant_id?: string
          tipo_ambiente?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_units_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          codigo_ibge: string | null
          complemento: string | null
          contato_responsavel: string | null
          created_at: string
          documento: string | null
          email: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          origem: string | null
          razao_social: string
          segmento: string | null
          tags: string[]
          telefone: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["person_type"]
          trilogo_company_id: number | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_ibge?: string | null
          complemento?: string | null
          contato_responsavel?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          origem?: string | null
          razao_social: string
          segmento?: string | null
          tags?: string[]
          telefone?: string | null
          tenant_id: string
          tipo?: Database["public"]["Enums"]["person_type"]
          trilogo_company_id?: number | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_ibge?: string | null
          complemento?: string | null
          contato_responsavel?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          origem?: string | null
          razao_social?: string
          segmento?: string | null
          tags?: string[]
          telefone?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["person_type"]
          trilogo_company_id?: number | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_amendments: {
        Row: {
          contract_id: string
          created_at: string
          data: string
          descricao: string
          id: string
          tenant_id: string
          valor_novo: number | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          data?: string
          descricao: string
          id?: string
          tenant_id: string
          valor_novo?: number | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tenant_id?: string
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_items: {
        Row: {
          contract_id: string
          created_at: string
          descricao: string
          id: string
          quantidade: number
          service_id: string | null
          tenant_id: string
          unit_id: string | null
          valor: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          descricao: string
          id?: string
          quantidade?: number
          service_id?: string | null
          tenant_id: string
          unit_id?: string | null
          valor?: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          service_id?: string | null
          tenant_id?: string
          unit_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "client_units"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          cancelado_em: string | null
          client_id: string
          created_at: string
          dia_faturamento: number
          id: string
          indice_reajuste: Database["public"]["Enums"]["adjustment_index"]
          motivo_cancelamento: string | null
          observacoes: string | null
          origem_quote_id: string | null
          periodicidade: Database["public"]["Enums"]["contract_periodicity"]
          proxima_visita_em: string | null
          status: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
          titulo: string
          updated_at: string
          valor: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          cancelado_em?: string | null
          client_id: string
          created_at?: string
          dia_faturamento?: number
          id?: string
          indice_reajuste?: Database["public"]["Enums"]["adjustment_index"]
          motivo_cancelamento?: string | null
          observacoes?: string | null
          origem_quote_id?: string | null
          periodicidade?: Database["public"]["Enums"]["contract_periodicity"]
          proxima_visita_em?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
          titulo: string
          updated_at?: string
          valor?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          cancelado_em?: string | null
          client_id?: string
          created_at?: string
          dia_faturamento?: number
          id?: string
          indice_reajuste?: Database["public"]["Enums"]["adjustment_index"]
          motivo_cancelamento?: string | null
          observacoes?: string | null
          origem_quote_id?: string | null
          periodicidade?: Database["public"]["Enums"]["contract_periodicity"]
          proxima_visita_em?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id?: string
          titulo?: string
          updated_at?: string
          valor?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_origem_quote_id_fkey"
            columns: ["origem_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tasks: {
        Row: {
          created_at: string
          deal_id: string
          done: boolean
          due_at: string | null
          id: string
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          done?: boolean
          due_at?: string | null
          id?: string
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          done?: boolean
          due_at?: string | null
          id?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string | null
          created_at: string
          descricao: string | null
          email: string | null
          id: string
          motivo_perda: Database["public"]["Enums"]["loss_reason"] | null
          nome_contato: string
          origem: Database["public"]["Enums"]["lead_origin"]
          owner_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          telefone: string | null
          tenant_id: string
          updated_at: string
          valor_estimado: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          id?: string
          motivo_perda?: Database["public"]["Enums"]["loss_reason"] | null
          nome_contato: string
          origem?: Database["public"]["Enums"]["lead_origin"]
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          telefone?: string | null
          tenant_id: string
          updated_at?: string
          valor_estimado?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          id?: string
          motivo_perda?: Database["public"]["Enums"]["loss_reason"] | null
          nome_contato?: string
          origem?: Database["public"]["Enums"]["lead_origin"]
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          ativo: boolean
          bairro: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          ctps: string | null
          data_admissao: string | null
          departamento: string | null
          email: string | null
          id: string
          logradouro: string | null
          nascimento: string | null
          nome: string
          numero: string | null
          pis: string | null
          registro_conselho: string | null
          responsavel_tecnico: boolean
          rg: string | null
          salario: number | null
          telefone: string | null
          tenant_id: string
          tipo_contrato: Database["public"]["Enums"]["contract_type"]
          uf: string | null
          updated_at: string
          user_id: string | null
          vencimento_anuidade: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          ctps?: string | null
          data_admissao?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          logradouro?: string | null
          nascimento?: string | null
          nome: string
          numero?: string | null
          pis?: string | null
          registro_conselho?: string | null
          responsavel_tecnico?: boolean
          rg?: string | null
          salario?: number | null
          telefone?: string | null
          tenant_id: string
          tipo_contrato?: Database["public"]["Enums"]["contract_type"]
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          vencimento_anuidade?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          ctps?: string | null
          data_admissao?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          logradouro?: string | null
          nascimento?: string | null
          nome?: string
          numero?: string | null
          pis?: string | null
          registro_conselho?: string | null
          responsavel_tecnico?: boolean
          rg?: string | null
          salario?: number | null
          telefone?: string | null
          tenant_id?: string
          tipo_contrato?: Database["public"]["Enums"]["contract_type"]
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          vencimento_anuidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_deliveries: {
        Row: {
          assinado: boolean
          created_at: string
          descricao: string
          employee_id: string
          entregue_em: string
          id: string
          tenant_id: string
          validade: string | null
        }
        Insert: {
          assinado?: boolean
          created_at?: string
          descricao: string
          employee_id: string
          entregue_em?: string
          id?: string
          tenant_id: string
          validade?: string | null
        }
        Update: {
          assinado?: boolean
          created_at?: string
          descricao?: string
          employee_id?: string
          entregue_em?: string
          id?: string
          tenant_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_deliveries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estruturas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estruturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          enabled: boolean
          id: string
          key: string
          tenant_id: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          key: string
          tenant_id: string
        }
        Update: {
          enabled?: boolean
          id?: string
          key?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_consents: {
        Row: {
          base_legal: string
          consentido_em: string
          finalidade: string
          id: string
          tenant_id: string
          titular_id: string
          titular_tipo: string
          versao_termo: string | null
        }
        Insert: {
          base_legal: string
          consentido_em?: string
          finalidade: string
          id?: string
          tenant_id: string
          titular_id: string
          titular_tipo: string
          versao_termo?: string | null
        }
        Update: {
          base_legal?: string
          consentido_em?: string
          finalidade?: string
          id?: string
          tenant_id?: string
          titular_id?: string
          titular_tipo?: string
          versao_termo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_requests: {
        Row: {
          created_at: string
          detalhe: string | null
          id: string
          status: Database["public"]["Enums"]["lgpd_request_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["lgpd_request_type"]
          titular_email: string
        }
        Insert: {
          created_at?: string
          detalhe?: string | null
          id?: string
          status?: Database["public"]["Enums"]["lgpd_request_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["lgpd_request_type"]
          titular_email: string
        }
        Update: {
          created_at?: string
          detalhe?: string | null
          id?: string
          status?: Database["public"]["Enums"]["lgpd_request_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["lgpd_request_type"]
          titular_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          assunto: string | null
          canal: Database["public"]["Enums"]["message_channel"]
          corpo: string | null
          created_at: string
          destino: string
          erro: string | null
          id: string
          provider_message_id: string | null
          related_id: string | null
          related_kind: string | null
          status: Database["public"]["Enums"]["message_status"]
          tenant_id: string
        }
        Insert: {
          assunto?: string | null
          canal: Database["public"]["Enums"]["message_channel"]
          corpo?: string | null
          created_at?: string
          destino: string
          erro?: string | null
          id?: string
          provider_message_id?: string | null
          related_id?: string | null
          related_kind?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          tenant_id: string
        }
        Update: {
          assunto?: string | null
          canal?: Database["public"]["Enums"]["message_channel"]
          corpo?: string | null
          created_at?: string
          destino?: string
          erro?: string | null
          id?: string
          provider_message_id?: string | null
          related_id?: string | null
          related_kind?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mip_devices: {
        Row: {
          ativo: boolean
          client_id: string | null
          created_at: string
          id: string
          numero: string
          pos_x: number | null
          pos_y: number | null
          qr_token: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["mip_device_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          client_id?: string | null
          created_at?: string
          id?: string
          numero: string
          pos_x?: number | null
          pos_y?: number | null
          qr_token?: string
          tenant_id: string
          tipo?: Database["public"]["Enums"]["mip_device_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          client_id?: string | null
          created_at?: string
          id?: string
          numero?: string
          pos_x?: number | null
          pos_y?: number | null
          qr_token?: string
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["mip_device_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mip_devices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mip_devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mip_devices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "client_units"
            referencedColumns: ["id"]
          },
        ]
      }
      mip_readings: {
        Row: {
          captura: number
          consumo_pct: number | null
          created_at: string
          created_by: string | null
          device_id: string
          id: string
          lida_em: string
          observacao: string | null
          os_id: string | null
          status: Database["public"]["Enums"]["mip_reading_status"]
          tenant_id: string
        }
        Insert: {
          captura?: number
          consumo_pct?: number | null
          created_at?: string
          created_by?: string | null
          device_id: string
          id?: string
          lida_em?: string
          observacao?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["mip_reading_status"]
          tenant_id: string
        }
        Update: {
          captura?: number
          consumo_pct?: number | null
          created_at?: string
          created_by?: string | null
          device_id?: string
          id?: string
          lida_em?: string
          observacao?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["mip_reading_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mip_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "mip_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mip_readings_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mip_readings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse: {
        Row: {
          ambiente: number | null
          ar_id: string | null
          chave_acesso: string | null
          client_id: string | null
          codigo_verificacao: string | null
          created_at: string
          created_by: string | null
          discriminacao: string | null
          id: string
          id_dps: string | null
          mensagem: string | null
          numero: string | null
          os_id: string | null
          pdf_url: string | null
          ref: string
          status: string
          tenant_id: string
          updated_at: string
          valor_servicos: number
          xml: string | null
          xml_url: string | null
        }
        Insert: {
          ambiente?: number | null
          ar_id?: string | null
          chave_acesso?: string | null
          client_id?: string | null
          codigo_verificacao?: string | null
          created_at?: string
          created_by?: string | null
          discriminacao?: string | null
          id?: string
          id_dps?: string | null
          mensagem?: string | null
          numero?: string | null
          os_id?: string | null
          pdf_url?: string | null
          ref: string
          status?: string
          tenant_id: string
          updated_at?: string
          valor_servicos?: number
          xml?: string | null
          xml_url?: string | null
        }
        Update: {
          ambiente?: number | null
          ar_id?: string | null
          chave_acesso?: string | null
          client_id?: string | null
          codigo_verificacao?: string | null
          created_at?: string
          created_by?: string | null
          discriminacao?: string | null
          id?: string
          id_dps?: string | null
          mensagem?: string | null
          numero?: string | null
          os_id?: string | null
          pdf_url?: string | null
          ref?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          valor_servicos?: number
          xml?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_ar_id_fkey"
            columns: ["ar_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfse_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfse_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_certificado: {
        Row: {
          created_at: string
          pfx_cripto: string
          senha_cripto: string
          tenant_id: string
          titular_doc: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          pfx_cripto: string
          senha_cripto: string
          tenant_id: string
          titular_doc?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          pfx_cripto?: string
          senha_cripto?: string
          tenant_id?: string
          titular_doc?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_certificado_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_responses: {
        Row: {
          client_id: string | null
          comentario: string | null
          created_at: string
          enviado_em: string
          id: string
          os_id: string | null
          respondido_em: string | null
          score: number | null
          tenant_id: string
          token: string
        }
        Insert: {
          client_id?: string | null
          comentario?: string | null
          created_at?: string
          enviado_em?: string
          id?: string
          os_id?: string | null
          respondido_em?: string | null
          score?: number | null
          tenant_id: string
          token?: string
        }
        Update: {
          client_id?: string | null
          comentario?: string | null
          created_at?: string
          enviado_em?: string
          id?: string
          os_id?: string | null
          respondido_em?: string | null
          score?: number | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_responses_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      occupational_exams: {
        Row: {
          anexo_url: string | null
          created_at: string
          data: string
          employee_id: string
          id: string
          resultado: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["exam_type"]
          validade: string | null
        }
        Insert: {
          anexo_url?: string | null
          created_at?: string
          data?: string
          employee_id: string
          id?: string
          resultado?: string | null
          tenant_id: string
          tipo?: Database["public"]["Enums"]["exam_type"]
          validade?: string | null
        }
        Update: {
          anexo_url?: string | null
          created_at?: string
          data?: string
          employee_id?: string
          id?: string
          resultado?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["exam_type"]
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupational_exams_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupational_exams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ativo: boolean
          features: Json
          id: string
          limite_os_mes: number | null
          limite_storage_gb: number | null
          limite_usuarios: number | null
          nome: string
          preco_mensal_cents: number
        }
        Insert: {
          ativo?: boolean
          features?: Json
          id?: string
          limite_os_mes?: number | null
          limite_storage_gb?: number | null
          limite_usuarios?: number | null
          nome: string
          preco_mensal_cents?: number
        }
        Update: {
          ativo?: boolean
          features?: Json
          id?: string
          limite_os_mes?: number | null
          limite_storage_gb?: number | null
          limite_usuarios?: number | null
          nome?: string
          preco_mensal_cents?: number
        }
        Relationships: []
      }
      platform_leads: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          mensagem: string | null
          meta: Json
          nome: string
          origem: string
          plano_interesse: string | null
          status: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          mensagem?: string | null
          meta?: Json
          nome: string
          origem?: string
          plano_interesse?: string | null
          status?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          mensagem?: string | null
          meta?: Json
          nome?: string
          origem?: string
          plano_interesse?: string | null
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      platform_plans: {
        Row: {
          ativo: boolean
          created_at: string
          cta_label: string
          cta_tipo: string
          descricao: string | null
          destaque: boolean
          features: Json
          id: string
          nome: string
          ordem: number
          periodo: string
          preco_centavos: number
          publico_alvo: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          cta_label?: string
          cta_tipo?: string
          descricao?: string | null
          destaque?: boolean
          features?: Json
          id?: string
          nome: string
          ordem?: number
          periodo?: string
          preco_centavos: number
          publico_alvo?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          cta_label?: string
          cta_tipo?: string
          descricao?: string | null
          destaque?: boolean
          features?: Json
          id?: string
          nome?: string
          ordem?: number
          periodo?: string
          preco_centavos?: number
          publico_alvo?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pragas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pragas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          antidoto: string | null
          ativo: boolean
          bula_url: string | null
          categoria: string | null
          classe_toxicologica: string | null
          codigo_interno: string | null
          created_at: string
          dose_m2: number | null
          estoque_minimo: number
          fabricante: string | null
          fator_diluicao: number | null
          fispq_url: string | null
          fornecedor_id: string | null
          grupo_quimico: string | null
          id: string
          nome_comercial: string
          preco_custo: number
          preco_venda: number
          principio_ativo: string | null
          registro_anvisa: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["product_type"]
          unidade_medida: string | null
          updated_at: string
        }
        Insert: {
          antidoto?: string | null
          ativo?: boolean
          bula_url?: string | null
          categoria?: string | null
          classe_toxicologica?: string | null
          codigo_interno?: string | null
          created_at?: string
          dose_m2?: number | null
          estoque_minimo?: number
          fabricante?: string | null
          fator_diluicao?: number | null
          fispq_url?: string | null
          fornecedor_id?: string | null
          grupo_quimico?: string | null
          id?: string
          nome_comercial: string
          preco_custo?: number
          preco_venda?: number
          principio_ativo?: string | null
          registro_anvisa?: string | null
          tenant_id: string
          tipo?: Database["public"]["Enums"]["product_type"]
          unidade_medida?: string | null
          updated_at?: string
        }
        Update: {
          antidoto?: string | null
          ativo?: boolean
          bula_url?: string | null
          categoria?: string | null
          classe_toxicologica?: string | null
          codigo_interno?: string | null
          created_at?: string
          dose_m2?: number | null
          estoque_minimo?: number
          fabricante?: string | null
          fator_diluicao?: number | null
          fispq_url?: string | null
          fornecedor_id?: string | null
          grupo_quimico?: string | null
          id?: string
          nome_comercial?: string
          preco_custo?: number
          preco_venda?: number
          principio_ativo?: string | null
          registro_anvisa?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["product_type"]
          unidade_medida?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_tenant_id: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_tenant_id_fkey"
            columns: ["active_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          codigo_fornecedor: string | null
          created_at: string
          criar_novo: boolean
          descricao: string
          id: string
          ordem: number
          product_id: string | null
          purchase_order_id: string
          quantidade: number
          tenant_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          codigo_fornecedor?: string | null
          created_at?: string
          criar_novo?: boolean
          descricao: string
          id?: string
          ordem?: number
          product_id?: string | null
          purchase_order_id: string
          quantidade?: number
          tenant_id: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          codigo_fornecedor?: string | null
          created_at?: string
          criar_novo?: boolean
          descricao?: string
          id?: string
          ordem?: number
          product_id?: string | null
          purchase_order_id?: string
          quantidade?: number
          tenant_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          confirmado_em: string | null
          created_at: string
          created_by: string | null
          emitido_em: string | null
          fornecedor_cnpj: string | null
          fornecedor_nome: string | null
          id: string
          numero_pedido: string | null
          origem: Database["public"]["Enums"]["purchase_order_origin"]
          parcelas: number
          raw_text: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string | null
          tenant_id: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          confirmado_em?: string | null
          created_at?: string
          created_by?: string | null
          emitido_em?: string | null
          fornecedor_cnpj?: string | null
          fornecedor_nome?: string | null
          id?: string
          numero_pedido?: string | null
          origem?: Database["public"]["Enums"]["purchase_order_origin"]
          parcelas?: number
          raw_text?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          confirmado_em?: string | null
          created_at?: string
          created_by?: string | null
          emitido_em?: string | null
          fornecedor_cnpj?: string | null
          fornecedor_nome?: string | null
          id?: string
          numero_pedido?: string | null
          origem?: Database["public"]["Enums"]["purchase_order_origin"]
          parcelas?: number
          raw_text?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          kind: Database["public"]["Enums"]["quote_item_kind"]
          preco_unit: number
          product_id: string | null
          quantidade: number
          quote_id: string
          service_id: string | null
          subtotal: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          kind?: Database["public"]["Enums"]["quote_item_kind"]
          preco_unit?: number
          product_id?: string | null
          quantidade?: number
          quote_id: string
          service_id?: string | null
          subtotal?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          kind?: Database["public"]["Enums"]["quote_item_kind"]
          preco_unit?: number
          product_id?: string | null
          quantidade?: number
          quote_id?: string
          service_id?: string | null
          subtotal?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          aceito_em: string | null
          client_id: string | null
          created_at: string
          deal_id: string | null
          desconto: number
          enviado_em: string | null
          id: string
          numero: number
          observacoes: string | null
          public_token: string
          recusado_em: string | null
          status: Database["public"]["Enums"]["quote_status"]
          tenant_id: string
          updated_at: string
          validade: string | null
        }
        Insert: {
          aceito_em?: string | null
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          desconto?: number
          enviado_em?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          public_token?: string
          recusado_em?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tenant_id: string
          updated_at?: string
          validade?: string | null
        }
        Update: {
          aceito_em?: string | null
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          desconto?: number
          enviado_em?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          public_token?: string
          recusado_em?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tenant_id?: string
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          expires_at: string
        }
        Insert: {
          bucket: string
          count?: number
          expires_at: string
        }
        Update: {
          bucket?: string
          count?: number
          expires_at?: string
        }
        Relationships: []
      }
      service_order_products: {
        Row: {
          batch_id: string | null
          created_at: string
          diluicao: string | null
          id: string
          os_id: string
          product_id: string
          quantidade: number
          tenant_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          diluicao?: string | null
          id?: string
          os_id: string
          product_id: string
          quantidade?: number
          tenant_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          diluicao?: string | null
          id?: string
          os_id?: string
          product_id?: string
          quantidade?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_products_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_products_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assinatura_cliente_url: string | null
          assinatura_tecnico_url: string | null
          chegada_em: string | null
          client_id: string
          contract_id: string | null
          created_at: string
          custo_combustivel: number | null
          custo_mao_obra: number | null
          custo_produtos: number | null
          custo_total: number | null
          estruturas: string[]
          executada_em: string | null
          external_ref: string | null
          external_url: string | null
          garantia_meses: number
          id: string
          km_rodado: number | null
          lat: number | null
          lng: number | null
          metodo: Database["public"]["Enums"]["application_method"] | null
          metragem_m2: number | null
          numero: number
          observacoes: string | null
          periodo_reentrada_horas: number | null
          pragas: string[]
          proxima_revisao_em: string | null
          quote_id: string | null
          recomendacoes: string | null
          saida_em: string | null
          scheduled_at: string | null
          source: string
          status: Database["public"]["Enums"]["os_status"]
          tecnico_id: string | null
          tempo_execucao_min: number | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assinatura_cliente_url?: string | null
          assinatura_tecnico_url?: string | null
          chegada_em?: string | null
          client_id: string
          contract_id?: string | null
          created_at?: string
          custo_combustivel?: number | null
          custo_mao_obra?: number | null
          custo_produtos?: number | null
          custo_total?: number | null
          estruturas?: string[]
          executada_em?: string | null
          external_ref?: string | null
          external_url?: string | null
          garantia_meses?: number
          id?: string
          km_rodado?: number | null
          lat?: number | null
          lng?: number | null
          metodo?: Database["public"]["Enums"]["application_method"] | null
          metragem_m2?: number | null
          numero?: number
          observacoes?: string | null
          periodo_reentrada_horas?: number | null
          pragas?: string[]
          proxima_revisao_em?: string | null
          quote_id?: string | null
          recomendacoes?: string | null
          saida_em?: string | null
          scheduled_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tempo_execucao_min?: number | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assinatura_cliente_url?: string | null
          assinatura_tecnico_url?: string | null
          chegada_em?: string | null
          client_id?: string
          contract_id?: string | null
          created_at?: string
          custo_combustivel?: number | null
          custo_mao_obra?: number | null
          custo_produtos?: number | null
          custo_total?: number | null
          estruturas?: string[]
          executada_em?: string | null
          external_ref?: string | null
          external_url?: string | null
          garantia_meses?: number
          id?: string
          km_rodado?: number | null
          lat?: number | null
          lng?: number | null
          metodo?: Database["public"]["Enums"]["application_method"] | null
          metragem_m2?: number | null
          numero?: number
          observacoes?: string | null
          periodo_reentrada_horas?: number | null
          pragas?: string[]
          proxima_revisao_em?: string | null
          quote_id?: string | null
          recomendacoes?: string | null
          saida_em?: string | null
          scheduled_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tempo_execucao_min?: number | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "client_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          garantia_padrao_meses: number
          id: string
          metodo_padrao: string | null
          nome: string
          praga_alvo_padrao: string | null
          preco_base: number
          tenant_id: string
          unidade_cobranca: Database["public"]["Enums"]["service_unit"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          garantia_padrao_meses?: number
          id?: string
          metodo_padrao?: string | null
          nome: string
          praga_alvo_padrao?: string | null
          preco_base?: number
          tenant_id: string
          unidade_cobranca?: Database["public"]["Enums"]["service_unit"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          garantia_padrao_meses?: number
          id?: string
          metodo_padrao?: string | null
          nome?: string
          praga_alvo_padrao?: string | null
          preco_base?: number
          tenant_id?: string
          unidade_cobranca?: Database["public"]["Enums"]["service_unit"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_batches: {
        Row: {
          created_at: string
          data_entrada: string
          fabricante: string | null
          id: string
          lote: string | null
          nf_entrada: string | null
          product_id: string
          qtd_atual: number
          qtd_entrada: number
          tenant_id: string
          updated_at: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          data_entrada?: string
          fabricante?: string | null
          id?: string
          lote?: string | null
          nf_entrada?: string | null
          product_id: string
          qtd_atual?: number
          qtd_entrada?: number
          tenant_id: string
          updated_at?: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          data_entrada?: string
          fabricante?: string | null
          id?: string
          lote?: string | null
          nf_entrada?: string | null
          product_id?: string
          qtd_atual?: number
          qtd_entrada?: number
          tenant_id?: string
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          motivo: string | null
          product_id: string
          quantidade: number
          related_id: string | null
          related_kind: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["stock_movement_type"]
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          product_id: string
          quantidade: number
          related_id?: string | null
          related_kind?: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["stock_movement_type"]
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          product_id?: string
          quantidade?: number
          related_id?: string | null
          related_kind?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["stock_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product_codes: {
        Row: {
          codigo_fornecedor: string
          created_at: string
          id: string
          product_id: string
          supplier_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          codigo_fornecedor: string
          created_at?: string
          id?: string
          product_id: string
          supplier_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          codigo_fornecedor?: string
          created_at?: string
          id?: string
          product_id?: string
          supplier_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_codes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          ativo: boolean
          categoria: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          telefone: string | null
          tenant_id: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          telefone?: string | null
          tenant_id: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          telefone?: string | null
          tenant_id?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_chats: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          nome: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          nome?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          nome?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_chats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_integrations: {
        Row: {
          bot_token: string
          bot_username: string | null
          created_at: string
          enabled: boolean
          id: string
          tenant_id: string
          updated_at: string
          webhook_secret: string
        }
        Insert: {
          bot_token: string
          bot_username?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          tenant_id: string
          updated_at?: string
          webhook_secret: string
        }
        Update: {
          bot_token?: string
          bot_username?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          tenant_id?: string
          updated_at?: string
          webhook_secret?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cnpj: string | null
          cor_primaria: string | null
          created_at: string
          custo_hora_padrao: number | null
          dominio_proprio: string | null
          id: string
          inscricao_municipal: string | null
          logo_url: string | null
          nfse_aliquota_iss: number | null
          nfse_ambiente: number
          nfse_cod_trib_nacional: string | null
          nfse_codigo_municipio: string | null
          nfse_inscricao_municipal: string | null
          nfse_iss_retido: boolean
          nfse_item_lista_servico: string | null
          nfse_natureza_operacao: string | null
          nfse_op_simples_nacional: number
          nfse_proximo_numero: number
          nfse_reg_especial: number
          nfse_regime_tributario: string | null
          nfse_serie: string
          nome_fantasia: string | null
          preco_combustivel_litro: number | null
          razao_social: string
          registro_vigilancia_sanitaria: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdominio: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          custo_hora_padrao?: number | null
          dominio_proprio?: string | null
          id?: string
          inscricao_municipal?: string | null
          logo_url?: string | null
          nfse_aliquota_iss?: number | null
          nfse_ambiente?: number
          nfse_cod_trib_nacional?: string | null
          nfse_codigo_municipio?: string | null
          nfse_inscricao_municipal?: string | null
          nfse_iss_retido?: boolean
          nfse_item_lista_servico?: string | null
          nfse_natureza_operacao?: string | null
          nfse_op_simples_nacional?: number
          nfse_proximo_numero?: number
          nfse_reg_especial?: number
          nfse_regime_tributario?: string | null
          nfse_serie?: string
          nome_fantasia?: string | null
          preco_combustivel_litro?: number | null
          razao_social: string
          registro_vigilancia_sanitaria?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdominio?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          custo_hora_padrao?: number | null
          dominio_proprio?: string | null
          id?: string
          inscricao_municipal?: string | null
          logo_url?: string | null
          nfse_aliquota_iss?: number | null
          nfse_ambiente?: number
          nfse_cod_trib_nacional?: string | null
          nfse_codigo_municipio?: string | null
          nfse_inscricao_municipal?: string | null
          nfse_iss_retido?: boolean
          nfse_item_lista_servico?: string | null
          nfse_natureza_operacao?: string | null
          nfse_op_simples_nacional?: number
          nfse_proximo_numero?: number
          nfse_reg_especial?: number
          nfse_regime_tributario?: string | null
          nfse_serie?: string
          nome_fantasia?: string | null
          preco_combustivel_litro?: number | null
          razao_social?: string
          registro_vigilancia_sanitaria?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdominio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          lat: number | null
          lng: number | null
          registrado_em: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["time_entry_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          registrado_em?: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["time_entry_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          registrado_em?: string
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["time_entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      trilogo_sync_runs: {
        Row: {
          criados: number
          detalhe: Json | null
          erros: number
          finished_at: string | null
          id: string
          mensagem: string | null
          ok: boolean
          origem: string
          pulados: number
          sem_mapeamento: number
          started_at: string
          tenant_id: string
        }
        Insert: {
          criados?: number
          detalhe?: Json | null
          erros?: number
          finished_at?: string | null
          id?: string
          mensagem?: string | null
          ok?: boolean
          origem?: string
          pulados?: number
          sem_mapeamento?: number
          started_at?: string
          tenant_id: string
        }
        Update: {
          criados?: number
          detalhe?: Json | null
          erros?: number
          finished_at?: string | null
          id?: string
          mensagem?: string | null
          ok?: boolean
          origem?: string
          pulados?: number
          sem_mapeamento?: number
          started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilogo_sync_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          ano: number | null
          ativo: boolean
          chassi: string | null
          consumo_km_l: number | null
          cor: string | null
          created_at: string
          id: string
          id_rastreador_traccar: string | null
          imei_rastreador: string | null
          km_atual: number | null
          km_proxima_revisao: number | null
          modelo: string | null
          placa: string
          renavam: string | null
          seguradora: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string
          vencimento_ipva: string | null
          vencimento_licenciamento: string | null
          vencimento_seguro: string | null
        }
        Insert: {
          ano?: number | null
          ativo?: boolean
          chassi?: string | null
          consumo_km_l?: number | null
          cor?: string | null
          created_at?: string
          id?: string
          id_rastreador_traccar?: string | null
          imei_rastreador?: string | null
          km_atual?: number | null
          km_proxima_revisao?: number | null
          modelo?: string | null
          placa: string
          renavam?: string | null
          seguradora?: string | null
          tenant_id: string
          tipo?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          vencimento_ipva?: string | null
          vencimento_licenciamento?: string | null
          vencimento_seguro?: string | null
        }
        Update: {
          ano?: number | null
          ativo?: boolean
          chassi?: string | null
          consumo_km_l?: number | null
          cor?: string | null
          created_at?: string
          id?: string
          id_rastreador_traccar?: string | null
          imei_rastreador?: string | null
          km_atual?: number | null
          km_proxima_revisao?: number | null
          modelo?: string | null
          placa?: string
          renavam?: string | null
          seguradora?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          vencimento_ipva?: string | null
          vencimento_licenciamento?: string | null
          vencimento_seguro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_campanhas: {
        Row: {
          concluida_em: string | null
          created_at: string
          enviados: number
          falhas: number
          id: string
          iniciada_em: string | null
          intervalo_segundos: number
          nome: string
          script_id: string | null
          status: string
          tenant_id: string
          total_contatos: number
          updated_at: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          enviados?: number
          falhas?: number
          id?: string
          iniciada_em?: string | null
          intervalo_segundos?: number
          nome: string
          script_id?: string | null
          status?: string
          tenant_id: string
          total_contatos?: number
          updated_at?: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          enviados?: number
          falhas?: number
          id?: string
          iniciada_em?: string | null
          intervalo_segundos?: number
          nome?: string
          script_id?: string | null
          status?: string
          tenant_id?: string
          total_contatos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_campanhas_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "wa_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_campanhas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_contatos: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          nome: string
          notas: string | null
          origem: string
          status: string
          tags: string[]
          telefone: string
          tenant_id: string
          updated_at: string
          variavel_1: string | null
          variavel_2: string | null
          variavel_3: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          nome: string
          notas?: string | null
          origem?: string
          status?: string
          tags?: string[]
          telefone: string
          tenant_id: string
          updated_at?: string
          variavel_1?: string | null
          variavel_2?: string | null
          variavel_3?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          notas?: string | null
          origem?: string
          status?: string
          tags?: string[]
          telefone?: string
          tenant_id?: string
          updated_at?: string
          variavel_1?: string | null
          variavel_2?: string | null
          variavel_3?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_contatos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_contatos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_disparos: {
        Row: {
          campanha_id: string
          contato_id: string | null
          created_at: string
          enviado_em: string | null
          erro: string | null
          id: string
          mensagem_enviada: string | null
          nome: string | null
          provider_message_id: string | null
          status: string
          telefone: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          campanha_id: string
          contato_id?: string | null
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem_enviada?: string | null
          nome?: string | null
          provider_message_id?: string | null
          status?: string
          telefone: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          campanha_id?: string
          contato_id?: string | null
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem_enviada?: string | null
          nome?: string | null
          provider_message_id?: string | null
          status?: string
          telefone?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_disparos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "wa_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_disparos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "wa_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_disparos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_scripts: {
        Row: {
          ativo: boolean
          corpo: string
          created_at: string
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          corpo: string
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          corpo?: string
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_scripts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      consume_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      current_client_id: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      has_role: {
        Args: { roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      nfse_reservar_numero: { Args: { p_tenant: string }; Returns: number }
      provision_tenant: {
        Args: { p_cnpj?: string; p_razao_social: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      absence_status: "solicitada" | "aprovada" | "recusada"
      absence_type: "ferias" | "atestado" | "licenca" | "folga" | "falta"
      account_type: "receita" | "despesa"
      adjustment_index: "nenhum" | "igpm" | "ipca"
      app_role:
        | "owner"
        | "financeiro"
        | "comercial"
        | "operacional"
        | "rh"
        | "tecnico"
        | "cliente"
      application_method:
        | "pulverizacao"
        | "polvilhamento"
        | "gel"
        | "isca"
        | "atomizacao"
        | "termonebulizacao"
        | "injecao"
        | "outro"
      bank_account_type: "corrente" | "poupanca" | "caixa" | "cartao"
      charge_status: "pendente" | "pago" | "cancelado" | "estornado"
      charge_type: "boleto" | "pix" | "manual"
      contract_periodicity:
        | "mensal"
        | "bimestral"
        | "trimestral"
        | "semestral"
        | "anual"
      contract_status: "ativo" | "suspenso" | "cancelado" | "encerrado"
      contract_type: "clt" | "pj" | "estagio" | "temporario"
      deal_stage:
        | "lead"
        | "contato"
        | "diagnostico"
        | "orcamento"
        | "negociacao"
        | "ganho"
        | "perdido"
      exam_type:
        | "admissional"
        | "periodico"
        | "demissional"
        | "retorno"
        | "mudanca"
      finance_status: "a_vencer" | "parcial" | "quitado" | "cancelado"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      lead_origin:
        | "indicacao"
        | "google"
        | "instagram"
        | "site"
        | "passagem"
        | "outro"
      lgpd_request_status: "open" | "in_progress" | "done" | "rejected"
      lgpd_request_type: "access" | "portability" | "erasure" | "rectification"
      loss_reason: "preco" | "prazo" | "concorrente" | "sem_retorno" | "outro"
      message_channel: "whatsapp" | "email"
      message_status: "queued" | "sent" | "failed" | "skipped"
      mip_device_type:
        | "porta_isca"
        | "armadilha_luminosa"
        | "estacao_monitoramento"
        | "armadilha_roedor"
        | "outro"
      mip_reading_status:
        | "sem_atividade"
        | "consumo_baixo"
        | "consumo_alto"
        | "captura"
        | "danificado"
        | "reposto"
      os_status:
        | "agendada"
        | "a_caminho"
        | "em_execucao"
        | "executada"
        | "faturada"
        | "cancelada"
      payment_method:
        | "pix"
        | "boleto"
        | "dinheiro"
        | "cartao"
        | "transferencia"
        | "outro"
      person_type: "PF" | "PJ"
      product_type: "concentrado" | "pronto_uso"
      purchase_order_origin: "upload" | "telegram"
      purchase_order_status: "rascunho" | "confirmado" | "cancelado"
      quote_item_kind: "servico" | "produto" | "outro"
      quote_status: "rascunho" | "enviado" | "aceito" | "recusado" | "expirado"
      recurrence: "unica" | "mensal" | "anual"
      request_status: "aberto" | "em_andamento" | "resolvido"
      request_type: "visita_extra" | "duvida" | "reclamacao" | "outro"
      service_unit: "m2" | "visita" | "ponto" | "hora"
      stock_movement_type:
        | "entrada"
        | "saida"
        | "perda"
        | "ajuste"
        | "transferencia"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      tenant_status: "trial" | "active" | "suspended" | "canceled"
      time_entry_type: "entrada" | "saida"
      vehicle_type: "carro" | "moto" | "van" | "caminhao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      absence_status: ["solicitada", "aprovada", "recusada"],
      absence_type: ["ferias", "atestado", "licenca", "folga", "falta"],
      account_type: ["receita", "despesa"],
      adjustment_index: ["nenhum", "igpm", "ipca"],
      app_role: [
        "owner",
        "financeiro",
        "comercial",
        "operacional",
        "rh",
        "tecnico",
        "cliente",
      ],
      application_method: [
        "pulverizacao",
        "polvilhamento",
        "gel",
        "isca",
        "atomizacao",
        "termonebulizacao",
        "injecao",
        "outro",
      ],
      bank_account_type: ["corrente", "poupanca", "caixa", "cartao"],
      charge_status: ["pendente", "pago", "cancelado", "estornado"],
      charge_type: ["boleto", "pix", "manual"],
      contract_periodicity: [
        "mensal",
        "bimestral",
        "trimestral",
        "semestral",
        "anual",
      ],
      contract_status: ["ativo", "suspenso", "cancelado", "encerrado"],
      contract_type: ["clt", "pj", "estagio", "temporario"],
      deal_stage: [
        "lead",
        "contato",
        "diagnostico",
        "orcamento",
        "negociacao",
        "ganho",
        "perdido",
      ],
      exam_type: [
        "admissional",
        "periodico",
        "demissional",
        "retorno",
        "mudanca",
      ],
      finance_status: ["a_vencer", "parcial", "quitado", "cancelado"],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      lead_origin: [
        "indicacao",
        "google",
        "instagram",
        "site",
        "passagem",
        "outro",
      ],
      lgpd_request_status: ["open", "in_progress", "done", "rejected"],
      lgpd_request_type: ["access", "portability", "erasure", "rectification"],
      loss_reason: ["preco", "prazo", "concorrente", "sem_retorno", "outro"],
      message_channel: ["whatsapp", "email"],
      message_status: ["queued", "sent", "failed", "skipped"],
      mip_device_type: [
        "porta_isca",
        "armadilha_luminosa",
        "estacao_monitoramento",
        "armadilha_roedor",
        "outro",
      ],
      mip_reading_status: [
        "sem_atividade",
        "consumo_baixo",
        "consumo_alto",
        "captura",
        "danificado",
        "reposto",
      ],
      os_status: [
        "agendada",
        "a_caminho",
        "em_execucao",
        "executada",
        "faturada",
        "cancelada",
      ],
      payment_method: [
        "pix",
        "boleto",
        "dinheiro",
        "cartao",
        "transferencia",
        "outro",
      ],
      person_type: ["PF", "PJ"],
      product_type: ["concentrado", "pronto_uso"],
      purchase_order_origin: ["upload", "telegram"],
      purchase_order_status: ["rascunho", "confirmado", "cancelado"],
      quote_item_kind: ["servico", "produto", "outro"],
      quote_status: ["rascunho", "enviado", "aceito", "recusado", "expirado"],
      recurrence: ["unica", "mensal", "anual"],
      request_status: ["aberto", "em_andamento", "resolvido"],
      request_type: ["visita_extra", "duvida", "reclamacao", "outro"],
      service_unit: ["m2", "visita", "ponto", "hora"],
      stock_movement_type: [
        "entrada",
        "saida",
        "perda",
        "ajuste",
        "transferencia",
      ],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
      tenant_status: ["trial", "active", "suspended", "canceled"],
      time_entry_type: ["entrada", "saida"],
      vehicle_type: ["carro", "moto", "van", "caminhao"],
    },
  },
} as const
