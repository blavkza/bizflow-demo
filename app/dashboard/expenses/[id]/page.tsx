import ExpenseDetailPage from "./components/ExpenseDetailPage";

interface ExpenseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page(props: ExpenseDetailPageProps) {
  const params = await props.params;

  return <ExpenseDetailPage params={params} />;
}
