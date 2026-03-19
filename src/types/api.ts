export interface Student {
  id: number
  name: string
  team_id: number | null
  team?: Team | null
  avatar_url?: string
  contact?: string
  qq?: string
  wechat?: string
  province?: string
  mbti?: string
  score?: number | null
  questionnaire_answers?: QuestionnaireAnswer[]
  has_answered_questionnaire?: boolean
}

export interface Team {
  id: number
  description?: string
  students?: Student[]
}

export interface QuestionnaireItem {
  id: string
  title: string
  weight: number
  data_type?: string
  params?: string
  type: string
  index: number
  page_id?: number | null
  index_in_page?: number | null
  updated_at?: string
  created_at?: string
}

export interface QuestionnaireAnswer {
  item_id: string
  answer: string
  weight: number
  item?: QuestionnaireItem
}

export interface QuestionnairePage {
  id: number
  title: string
  remark?: string | null
  index: number
  items: QuestionnaireItem[]
}

export interface SystemSettings {
  team_max_student_count?: string | number
  login_bg_url?: string
  student_guide_bg_color?: string
  student_logo_url?: string
  student_nav_system_name?: string
}

export interface Announcement {
  id: number
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface ApiResponse<T = unknown> {
  code: number
  msg?: string
  data: T
}

export interface LoginResponse {
  access_token: string
  user: Student
}
