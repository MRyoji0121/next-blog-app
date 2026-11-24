export type Priority = "urgent" | "high" | "medium" | "low";
export type EventCategory = "collab" | "advent" | "campaign" | "other";

export interface ScheduleEvent {
  id: string;
  title: string;
  category: EventCategory;
  priority: Priority;
  startAt: string; 
  endAt: string;    
    isLongTerm: boolean;
    remindMinutes: number;
  memo?: string;
}