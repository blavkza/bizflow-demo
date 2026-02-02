import { LenderDetailClient } from "./_components/lender-detail-client";

const LenderIdPage = async ({
    params
}: {
    params: Promise<{ id: string }>
}) => {
    const { id } = await params;
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <LenderDetailClient lenderId={id} />
        </div>
    );
}

export default LenderIdPage;
