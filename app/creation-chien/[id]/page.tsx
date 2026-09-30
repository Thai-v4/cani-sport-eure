import DogForm from "../../components/member/DogForm";

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DogForm dogId={id === "new" ? undefined : id} />;
}
