import { PublicContractPage } from "@/components/public-contract-page"

export default async function ClienteContratoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return <PublicContractPage token={token} />
}
