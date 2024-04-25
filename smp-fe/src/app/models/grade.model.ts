export interface Grade {
    grade_id: number;
    semester: number;
    student_id?: number;
    subject_id?: number;
    quiz_grade?: number;
    homework_grade?: number;
    test_grade?: number;
    project_grade?: number;
}