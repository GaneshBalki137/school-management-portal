export interface Schedule{
    timetable_id?: number;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    class_id?: number;
    subject_id?: number;
    teacher_id?: number;
}