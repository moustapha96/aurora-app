import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  MEMBER_PAGE_KEYS,
  PAGE_KEY_TO_LABEL_KEY,
} from "@/lib/memberPagePermissions";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Search, Save, Loader2, KeyRound } from "lucide-react";

interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  profile_image_base64?: string | null;
}

export default function AdminPagePermissions() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, avatar_url, profile_image_base64"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("member_page_permissions").select("user_id, page_key"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (permsRes.error) throw permsRes.error;

      const adminIds = new Set(
        (rolesRes.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id)
      );
      const memberProfiles = (profilesRes.data ?? []).filter((p) => !adminIds.has(p.id)) as MemberProfile[];
      setMembers(memberProfiles);

      const permsByUser: Record<string, Set<string>> = {};
      (permsRes.data ?? []).forEach((row) => {
        if (!permsByUser[row.user_id]) permsByUser[row.user_id] = new Set();
        permsByUser[row.user_id].add(row.page_key);
      });
      setPermissions(permsByUser);
    } catch (e: any) {
      console.error(e);
      toast({
        title: t("errorTitle"),
        description: e?.message ?? t("pagePermLoadError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.first_name ?? "").toLowerCase().includes(q) ||
        (m.last_name ?? "").toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const startIndex = filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredMembers.length);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const togglePermission = (userId: string, pageKey: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      const set = new Set(next[userId] ?? []);
      if (checked) set.add(pageKey);
      else set.delete(pageKey);
      next[userId] = set;
      return next;
    });
  };

  const setAllPagesForUser = (userId: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      if (checked) next[userId] = new Set(MEMBER_PAGE_KEYS);
      else next[userId] = new Set();
      return next;
    });
  };

  const saveForUser = async (userId: string) => {
    setSavingUserId(userId);
    try {
      const allowed = permissions[userId] ?? new Set<string>();
      await supabase.from("member_page_permissions").delete().eq("user_id", userId);
      if (allowed.size > 0) {
        const rows = Array.from(allowed).map((page_key) => ({ user_id: userId, page_key }));
        const { error } = await supabase.from("member_page_permissions").insert(rows);
        if (error) throw error;
      }
      toast({
        title: t("success"),
        description: t("pagePermSaved"),
      });
    } catch (e: any) {
      toast({
        title: t("errorTitle"),
        description: e?.message ?? t("pagePermSaveError"),
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const grantAllToAll = async () => {
    setSavingUserId("__all__");
    try {
      for (const member of members) {
        const rows = MEMBER_PAGE_KEYS.map((page_key) => ({
          user_id: member.id,
          page_key,
        }));
        await supabase.from("member_page_permissions").delete().eq("user_id", member.id);
        await supabase.from("member_page_permissions").insert(rows);
      }
      setPermissions((prev) => {
        const next = { ...prev };
        members.forEach((m) => {
          next[m.id] = new Set(MEMBER_PAGE_KEYS);
        });
        return next;
      });
      toast({
        title: t("success"),
        description: t("pagePermGrantAllDone"),
      });
    } catch (e: any) {
      toast({
        title: t("errorTitle"),
        description: e?.message ?? t("pagePermSaveError"),
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t("pagePermTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("pagePermDescription")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("pagePermSearchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={grantAllToAll}
                disabled={loading || savingUserId !== null || members.length === 0}
              >
                {savingUserId === "__all__" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("pagePermGrantAll")
                )}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">{t("pagePermMember")}</TableHead>
                      <TableHead className="text-center w-24">{t("pagePermAll")}</TableHead>
                      {MEMBER_PAGE_KEYS.map((key) => (
                        <TableHead key={key} className="text-center w-20">
                          {t(PAGE_KEY_TO_LABEL_KEY[key])}
                        </TableHead>
                      ))}
                      <TableHead className="w-24">{t("pagePermActions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={MEMBER_PAGE_KEYS.length + 3} className="text-center text-muted-foreground py-8">
                          {t("pagePermNoMembers")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMembers.map((member) => {
                        const userPerms = permissions[member.id] ?? new Set();
                        const allChecked = MEMBER_PAGE_KEYS.every((k) => userPerms.has(k));
                        return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={((member as any).profile_image_base64 || member.avatar_url) ?? undefined} />
                                  <AvatarFallback>
                                    {(member.first_name?.[0] ?? "?") + (member.last_name?.[0] ?? "?")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {member.first_name} {member.last_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={allChecked}
                                onCheckedChange={(checked) =>
                                  setAllPagesForUser(member.id, checked === true)
                                }
                              />
                            </TableCell>
                            {MEMBER_PAGE_KEYS.map((pageKey) => (
                              <TableCell key={pageKey} className="text-center">
                                <Checkbox
                                  checked={userPerms.has(pageKey)}
                                  onCheckedChange={(checked) =>
                                    togglePermission(member.id, pageKey, checked === true)
                                  }
                                />
                              </TableCell>
                            ))}
                            <TableCell>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => saveForUser(member.id)}
                                disabled={savingUserId === member.id}
                              >
                                {savingUserId === member.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-1" />
                                    {t("pagePermSave")}
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                {filteredMembers.length > 0 && (
                  <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredMembers.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    startIndex={startIndex}
                    endIndex={endIndex}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
