import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Dummy data for preview
// const PREVIEW_DATA = {
//   monthlyReport: {
//     userName: "John Doe",
//     type: "monthly-report",
//     data: {
//       month: "December",
//       stats: {
//         totalIncome: 5000,
//         totalExpenses: 3500,
//         byCategory: {
//           housing: 1500,
//           groceries: 600,
//           transportation: 400,
//           entertainment: 300,
//           utilities: 700,
//         },
//       },
//       insights: [
//         "Your housing expenses are 43% of your total spending - consider reviewing your housing costs.",
//         "Great job keeping entertainment expenses under control this month!",
//         "Setting up automatic savings could help you save 20% more of your income.",
//       ],
//     },
//   },
//   budgetAlert: {
//     userName: "John Doe",
//     type: "budget-alert",
//     data: {
//       percentageUsed: 85,
//       budgetAmount: 4000,
//       totalExpenses: 3400,
//     },
//   },
// };

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Monthly Financial Report</Heading>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for {data?.month}:
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Income</Text>
                <Text style={styles.heading}>${data?.stats.totalIncome}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Expenses</Text>
                <Text style={styles.heading}>${data?.stats.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Net</Text>
                <Text style={styles.heading}>
                  ${data?.stats.totalIncome - data?.stats.totalExpenses}
                </Text>
              </div>
            </Section>

            {/* Category Breakdown */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(data?.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.text}>{category}</Text>
                      <Text style={styles.text}>${amount}</Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>FinEdge Insights</Heading>
                {data.insights.map((insight, index) => (
                  <Text key={index} style={styles.text}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using FinEdge. Keep tracking your finances for better
              financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget Alert</Heading>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used {data?.percentageUsed.toFixed(1)}% of your
              monthly budget.
            </Text>
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Budget Amount</Text>
                <Text style={styles.heading}>{data?.budgetAmount}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Spent So Far</Text>
                <Text style={styles.heading}>{data?.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Remaining</Text>
                <Text style={styles.heading}>
                  {data?.budgetAmount - data?.totalExpenses}
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "fraud-alert") {
    return (
      <Html>
        <Head />
        <Preview>⚠️ Suspicious Transaction Alert</Preview>
        <Body style={{ ...styles.body, backgroundColor: "#fff1f2" }}>
          <Container style={{ ...styles.container, border: "2px solid #f87171", backgroundColor: "#fff1f2" }}>
            <Heading style={{ ...styles.title, color: "#b91c1c" }}>Suspicious Transaction Alert</Heading>
            <Text style={{ ...styles.text, color: "#b91c1c", fontWeight: 600 }}>
              Hello {userName},
            </Text>
            <Text style={{ ...styles.text, color: "#b91c1c" }}>
              We detected a transaction that looks <b>unusual</b> compared to your past spending patterns:
            </Text>
            <Section style={{ ...styles.section, backgroundColor: "#fee2e2", border: "1px solid #fca5a5" }}>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ ...styles.text, color: "#b91c1c" }}><b>Amount:</b> ₹{data.amount}</Text>
                <Text style={{ ...styles.text, color: "#b91c1c" }}><b>Date:</b> {data.date}</Text>
                <Text style={{ ...styles.text, color: "#b91c1c" }}><b>Merchant:</b> {data.merchant || "Unknown"}</Text>
                <Text style={{ ...styles.text, color: "#b91c1c" }}><b>Category:</b> {data.category}</Text>
                <Text style={{ ...styles.text, color: "#b91c1c" }}><b>Confidence Unusual:</b> {data.confidence}%</Text>
                {data.reason && (
                  <Text style={{ ...styles.text, color: "#b91c1c" }}><b>Reason:</b> {data.reason}</Text>
                )}
              </div>
              <Text style={{ ...styles.text, color: "#b91c1c" }}>
                If this was <b>not you</b>, please review your account immediately.
              </Text>
            </Section>
            <Text style={{ ...styles.footer, color: "#b91c1c" }}>
              Your security is our top priority.<br />
              - The FinEdge Team
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "32px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  stat: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "32px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
};
