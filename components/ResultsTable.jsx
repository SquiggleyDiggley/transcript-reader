export default function ResultsTable({ data }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Extracted Courses</h2>
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Raw Course</th>
            <th>Grade</th>
            <th>Credits</th>
            <th>Suggested Equivalent</th>
            <th>Confidence</th>
            <th>Needs Review</th>
          </tr>
        </thead>
        <tbody>
          {data.extractedCourses.map((course, index) => (
            <tr key={`${course.rawCourse}-${index}`}>
              <td>{course.rawCourse}</td>
              <td>{course.grade ?? '-'}</td>
              <td>{course.credits ?? '-'}</td>
              <td>{course.matchedEquivalent ?? 'No match'}</td>
              <td>{course.confidence}</td>
              <td>{course.needsReview ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Completed</h2>
      <ul>{data.completed.map((course) => <li key={course}>{course}</li>)}</ul>

      <h2>Eligible Next</h2>
      <ul>{data.eligibleNext.map((course) => <li key={course}>{course}</li>)}</ul>

      <h2>Blocked</h2>
      <ul>
        {data.blocked.map((item) => (
          <li key={item.course}>
            {item.course} - Missing: {item.missingPrerequisites.join(', ')}
          </li>
        ))}
      </ul>

      <h2>Remaining</h2>
      <ul>{data.remaining.map((course) => <li key={course}>{course}</li>)}</ul>
    </div>
  );
}
