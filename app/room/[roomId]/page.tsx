import GameApp from "@/components/GameApp";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <GameApp initialRoomId={roomId} />;
}
