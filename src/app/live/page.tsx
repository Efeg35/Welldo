import { DashboardLayout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Mic,
  MonitorUp,
  Circle,
  Smile,
  Hand,
  Users,
  LayoutGrid,
  LogOut,
  PhoneOff,
  Video,
  Settings
} from "lucide-react";

const participants = [
  { name: "Paula Mora", avatar: "paula", isHost: true, isTalking: true },
  { name: "Devon Lane", avatar: "devon" },
  { name: "RF", isInitials: true, color: "bg-purple-500" },
  { name: "Kristin Watson", avatar: "kristin", isMuted: true },
];

export default function LivePage() {
  return (
    <DashboardLayout showSidebar={false} showSecondaryNav={false}>
      <div className="flex flex-col h-[calc(100vh-112px)] bg-black">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">Geleceğin Kurucuları</span>
            <span className="text-white/60">Yeni fikirleriniz için iş stratejisi</span>
            <Button variant="ghost" size="icon" className="text-white/60">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2">
            {participants.map((p, i) => (
              <div key={i} className="relative">
                <Avatar className={`w-12 h-12 border-2 ${p.isTalking ? 'border-green-500' : 'border-transparent'}`}>
                  {p.isInitials ? (
                    <div className={`w-full h-full ${p.color} flex items-center justify-center text-white font-medium`}>
                      {p.name}
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                {p.isMuted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <Mic className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="block text-center text-white/80 text-xs mt-1 truncate max-w-[60px]">
                  {p.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Video Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Main Speaker */}
          <div className="relative">
            <div className="w-[800px] h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=500&fit=crop"
                alt="Konuşmacı"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Speaker Name Tag */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-white text-sm">Paula Mora</span>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="h-6 w-px bg-white/20" />
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <span className="text-xs">|||</span>
            </Button>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-12 h-12 rounded-full">
              <Camera className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-12 h-12 rounded-full">
              <Mic className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-12 h-12 rounded-full">
              <MonitorUp className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600">
              <Circle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-12 h-12 rounded-full">
              <Smile className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-12 h-12 rounded-full">
              <Hand className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1.5 ml-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm">25</span>
            </div>

            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-1">
              <LayoutGrid className="w-4 h-4" />
              Görünüm
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-white border-white/20 hover:bg-white/10">
              <LogOut className="w-4 h-4" />
              Ayrıl
            </Button>
            <Button variant="destructive" size="sm" className="gap-2">
              <PhoneOff className="w-4 h-4" />
              Odayı sonlandır
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
