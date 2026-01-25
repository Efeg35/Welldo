"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createSpaceGroup } from "@/actions/community";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateSpaceGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
}

export function CreateSpaceGroupModal({ isOpen, onClose, communityId }: CreateSpaceGroupModalProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isPending, setIsPending] = useState(false);

    // Permissions
    const [hideMemberCount, setHideMemberCount] = useState(false);
    const [hideFromNonMembers, setHideFromNonMembers] = useState(false);
    const [onlyShowJoined, setOnlyShowJoined] = useState(false);
    const [allowMembersCreate, setAllowMembersCreate] = useState(false);

    const handleCreate = async () => {
        if (!name || !slug) return;

        setIsPending(true);
        try {
            await createSpaceGroup(communityId, name, slug, {
                hide_member_count: hideMemberCount,
                hide_from_non_members: hideFromNonMembers,
                only_show_joined: onlyShowJoined,
                allow_members_create_spaces: allowMembersCreate // Though usually admins create spaces
            });
            toast.success("Alan grubu oluşturuldu");
            onClose();
            router.refresh();
            // Reset form
            setName("");
            setSlug("");
        } catch (error) {
            toast.error("Alan grubu oluşturulamadı");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create space group</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Space group name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    // Auto-generate slug
                                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Custom URL slug (optional)</Label>
                            <Input
                                id="slug"
                                placeholder="Example: members-area"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-gray-900 border-b pb-2">Permissions</h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="hide-count" className="text-sm font-normal text-gray-700 cursor-pointer">Hide member count</Label>
                            <Switch id="hide-count" checked={hideMemberCount} onCheckedChange={setHideMemberCount} />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="hide-non-members" className="text-sm font-normal text-gray-700 cursor-pointer">Hide from non-space members</Label>
                            <Switch id="hide-non-members" checked={hideFromNonMembers} onCheckedChange={setHideFromNonMembers} />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="only-joined" className="text-sm font-normal text-gray-700 cursor-pointer">Only show joined spaces in the sidebar</Label>
                            <Switch id="only-joined" checked={onlyShowJoined} onCheckedChange={setOnlyShowJoined} />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="allow-create" className="text-sm font-normal text-gray-700 cursor-pointer">Allow members to create spaces</Label>
                            <Switch id="allow-create" checked={allowMembersCreate} onCheckedChange={setAllowMembersCreate} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleCreate}
                        disabled={!name || isPending}
                        className="w-full bg-gray-900 hover:bg-black text-white"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
