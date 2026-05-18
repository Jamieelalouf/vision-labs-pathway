type EnrollmentWithCompletionStatus = {
  completion_status?: string | null;
};

export function countCompletedEnrollments(
  enrollments: EnrollmentWithCompletionStatus[] | null | undefined
) {
  if (!enrollments?.length) return 0;
  return enrollments.filter((enrollment) => enrollment.completion_status === "completed").length;
}
