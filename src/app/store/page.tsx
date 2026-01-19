import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Users, Calendar, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

// Mock store items (memberships and events)
const storeItems = [
    {
        id: "1",
        type: "membership",
        title: "Yoga Ailesi Üyeliği",
        instructor: "Ayşe Yılmaz",
        price: 299,
        period: "aylık",
        rating: 4.9,
        members: 1240,
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
    },
    {
        id: "2",
        type: "event",
        title: "Antalya Yoga Kampı",
        instructor: "Ayşe Yılmaz",
        price: 2500,
        date: "15-17 Şubat",
        location: "Antalya",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
    },
    {
        id: "3",
        type: "membership",
        title: "Fitness Warriors Pro",
        instructor: "Mehmet Demir",
        price: 199,
        period: "aylık",
        rating: 4.7,
        members: 890,
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    },
];

export default function StorePage() {
    return (
        <div className="flex flex-col gap-6 px-4 py-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Mağaza</h1>
                <p className="text-sm text-muted-foreground">
                    Üyelikler, etkinlikler ve daha fazlası
                </p>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <Badge className="cursor-pointer bg-violet-500 hover:bg-violet-600">
                    Tümü
                </Badge>
                <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                >
                    <Users className="mr-1 h-3 w-3" />
                    Üyelikler
                </Badge>
                <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                >
                    <Calendar className="mr-1 h-3 w-3" />
                    Etkinlikler
                </Badge>
            </div>

            {/* Store Items Grid */}
            <div className="grid grid-cols-1 gap-4">
                {storeItems.map((item) => (
                    <Link
                        key={item.id}
                        href={`/store/${item.id}`}
                        className="group overflow-hidden rounded-2xl bg-card transition-transform active:scale-[0.98]"
                    >
                        {/* Image */}
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            <Badge
                                className="absolute left-3 top-3"
                                variant={item.type === "event" ? "destructive" : "default"}
                            >
                                {item.type === "event" ? (
                                    <>
                                        <Calendar className="mr-1 h-3 w-3" />
                                        Etkinlik
                                    </>
                                ) : (
                                    <>
                                        <Users className="mr-1 h-3 w-3" />
                                        Üyelik
                                    </>
                                )}
                            </Badge>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-2 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {item.instructor}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-violet-500">
                                        ₺{item.price}
                                    </span>
                                    {item.period && (
                                        <span className="text-xs text-muted-foreground">
                                            /{item.period}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {item.rating && (
                                    <span className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                        {item.rating}
                                    </span>
                                )}
                                {item.members && (
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {item.members} üye
                                    </span>
                                )}
                                {item.date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {item.date}
                                    </span>
                                )}
                                {item.location && <span>📍 {item.location}</span>}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {storeItems.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                        <ShoppingBag className="h-8 w-8 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Henüz ürün yok</h2>
                        <p className="text-sm text-muted-foreground">
                            Yakında yeni içerikler eklenecek!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
