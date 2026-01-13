import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Crown, Heart, Diamond, BadgeDollarSign, SlidersHorizontal, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConnectionRequests } from "@/components/ConnectionRequests";
import { WealthBadge } from "@/components/WealthBadge";
import { IdentityVerifiedBadge } from "@/components/VerificationBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { INDUSTRIES } from "@/lib/industries";
import { COUNTRIES } from "@/lib/countries";
import { LinkedAccountGuard } from "@/components/LinkedAccountGuard";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = {
  id: string;
  name: string;
  honorific_title?: string | null;
  title: string;
  industry: string;
  location: string;
  avatar: string;
  avatar_url?: string | null;
  badge: string;
  is_founder: boolean;
  is_patron: boolean;
  identity_verified: boolean;
  wealth_billions: string | null;
  wealth_amount: string | null;
  wealth_unit: string | null;
  wealth_currency: string | null;
  wealth_numeric: number;
  friends: string[];
  connections_count?: number;
};

// Composant LinkedIn-style pour les cartes membres
const MemberCard = ({ member, onClick, status, isSelected, t }: { member: Member; onClick: () => void; status?: string; isSelected?: boolean; t: (key: string) => string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Create a unique key for each member's avatar to prevent cache issues
  const avatarSrc = React.useMemo(() => {
    if (!member.avatar_url) return null;
    // Add member ID as cache buster for base64 images
    if (member.avatar_url.startsWith('data:')) {
      return member.avatar_url;
    }
    return member.avatar_url;
  }, [member.avatar_url, member.id]);
  
  return (
    <Card 
      className={`bg-[hsl(var(--navy-blue-light))] border-gold/20 hover:border-gold/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-gold/10 group overflow-hidden ${isSelected ? 'ring-2 ring-gold shadow-gold' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Header uniforme */}
        <div className="h-16 relative">
          {member.is_founder && (
            <Badge className="absolute top-2 left-2 bg-gold text-black px-2 py-0.5 flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" />
              <span className="text-xs font-semibold">{t('founderBadge')}</span>
            </Badge>
          )}
        </div>
        
        {/* Avatar centré sur la bordure */}
        <div className="relative px-6 pb-6">
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-black ring-2 ring-gold/30" key={member.id}>
                {!imageLoaded && avatarSrc && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full rounded-full" />
                  </div>
                )}
                {avatarSrc && !imageError && (
                  <AvatarImage 
                    src={avatarSrc} 
                    alt={member.name}
                    loading="lazy"
                    className="object-cover"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/5 text-gold text-2xl font-serif">
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              
              {/* Badge de vérification d'identité */}
              {/* <IdentityVerifiedBadge isVerified={member.identity_verified} /> */}
              
              {/* Wealth Badge - Top right (2 o'clock/14h) */}
              <WealthBadge 
                wealthBillions={member.wealth_billions}
                wealthAmount={member.wealth_amount}
                wealthUnit={member.wealth_unit}
                wealthCurrency={member.wealth_currency}
                className="absolute top-0 -right-1 z-20"
              />
              
              {/* Badge nombre de relations - toujours visible */}
              <div className="absolute -top-2 -right-2 bg-gold text-black rounded-full w-10 h-10 flex items-center justify-center border-2 border-[hsl(var(--navy-blue-light))] shadow-xl z-10">
                <div className="flex flex-col items-center justify-center gap-0">
                  <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="text-xs font-bold leading-none mt-0.5">{member.connections_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informations du membre */}
          <div className="text-center space-y-2">
            {member.honorific_title && (
              <p className="text-xs text-gold/60 font-medium uppercase tracking-wide">{member.honorific_title}</p>
            )}
            <h3 className="text-lg font-serif text-gold group-hover:text-gold/80 transition-colors line-clamp-1">
              {member.name}
            </h3>
            <p className="text-sm text-gold/70 line-clamp-1">{member.title}</p>
            <p className="text-xs text-gold/50 line-clamp-1">{member.industry}</p>
            {member.location && (
              <p className="text-xs text-gold/60 line-clamp-1">{member.location}</p>
            )}
            
            {/* Status badge */}
            {status && (
              <Badge variant="outline" className="mt-2 border-gold/30 text-gold/70">
                {status === "connected" ? t('connected') : status === "pending" ? t('pendingRequest') : t('connect')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate badge from wealth
const calculateBadgeFromWealth = (wealthBillions: string | null): string => {
  if (!wealthBillions) return "none";
  const wealth = parseFloat(wealthBillions);
  
  if (wealth > 0.1) {
    return "diamond";
  } else if (wealth >= 0.03) {
    return "platinum";
  } else if (wealth >= 0.01) {
    return "gold";
  } else {
    return "none";
  }
};

const Members = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: "pending" | "connected" }>({});
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [wealthSort, setWealthSort] = useState<string>("none");
  const [circleFilter, setCircleFilter] = useState<string>("all");
  const [friendNameFilter, setFriendNameFilter] = useState<string>("all");
  const [friendWealthFilter, setFriendWealthFilter] = useState<string>("all");
  const [showOnlyConnections, setShowOnlyConnections] = useState(() => searchParams.get('showConnections') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const membersPerPage = 10;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [userFriendships, setUserFriendships] = useState<string[]>([]);
  const [currentUserBadge, setCurrentUserBadge] = useState<string>("gold");
  
  const badgeHierarchy: { [key: string]: number } = {
    diamond: 3,
    platinum: 2,
    gold: 1,
    none: 0,
  };
  
  const badgePrices: { [key: string]: string } = {
    diamond: "5000",
    platinum: "2500",
    gold: "1000",
  };

  const [members, setMembers] = React.useState<any[]>([]);

  // Extract unique values for filters
  const industries = Array.from(new Set(members.map(m => m.industry)));
  
  // Extract all unique friends with their wealth info
  const allFriends = Array.from(new Set(members.flatMap(m => m.friends || [])))
    .map(friendName => {
      const friendMember = members.find(m => m.name === friendName);
      return {
        name: friendName,
        wealth: friendMember?.wealth_billions || null,
        wealth_numeric: friendMember?.wealth_numeric || 0
      };
    });
  
  const friendsByName = [...allFriends].sort((a, b) => a.name.localeCompare(b.name));
  const friendsByWealth = [...allFriends].sort((a, b) => b.wealth_numeric - a.wealth_numeric);

  // Get current user's profile to exclude from members list
  const [currentUserProfile, setCurrentUserProfile] = React.useState<any>(null);

  
  // State for cached data that doesn't change with pagination
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userFriendIdsCache, setUserFriendIdsCache] = React.useState<string[]>([]);
  const [isUserDataLoaded, setIsUserDataLoaded] = React.useState(false);

  // Load user data ONCE on mount (not on every filter/page change)
  React.useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      setUserId(user.id);
      setCurrentUserProfile({ id: user.id });
      
      // Parallel loading of user private data and friendships
      const [privateResult, friendshipsResult] = await Promise.all([
        supabase
          .from('profiles_private')
          .select('wealth_billions')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('friendships')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      ]);
      
      // Process user badge
      if (!privateResult.error && privateResult.data?.wealth_billions) {
        setCurrentUserBadge(calculateBadgeFromWealth(privateResult.data.wealth_billions));
      } else {
        setCurrentUserBadge("none");
      }
      
      // Process friendships - only current user's friends
      const friendIds: string[] = [];
      if (friendshipsResult.data) {
        friendshipsResult.data.forEach(f => {
          if (f.user_id === user.id) friendIds.push(f.friend_id);
          else if (f.friend_id === user.id) friendIds.push(f.user_id);
        });
      }
      
      setUserFriendIdsCache(friendIds);
      setUserFriendships(friendIds);
      setIsUserDataLoaded(true);
    };
    
    loadUserData();
  }, [navigate]);

  // Load members when user data is ready or filters change
  React.useEffect(() => {
    if (!isUserDataLoaded || !userId) return;
    
    const loadMembers = async () => {
      setIsInitialLoad(true);
      
      // Load ALL members matching server-side filters (no pagination yet)
      // We'll paginate after client-side filtering
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, honorific_title, job_function, activity_domain, country, is_founder, is_patron, avatar_url, identity_verified', { count: 'exact' })
        .neq('id', userId);
      
      // Apply server-side filters only
      if (showOnlyConnections && userFriendIdsCache.length > 0) {
        query = query.in('id', userFriendIdsCache);
      } else if (showOnlyConnections && userFriendIdsCache.length === 0) {
        // No connections, return empty
        setMembers([]);
        setTotalPages(0);
        setIsInitialLoad(false);
        return;
      }
      
      if (industryFilter !== "all") {
        query = query.eq('activity_domain', industryFilter);
      }
      
      if (locationFilter && locationFilter !== "all") {
        query = query.eq('country', locationFilter);
      }
      
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,job_function.ilike.%${searchTerm}%,account_number.ilike.%${searchTerm}%`);
      }
      
      // Load all matching profiles (we'll paginate after client-side filtering)
      const { data: profiles, error, count } = await query;
      
      if (error) {
        console.error('Error loading profiles:', error);
        setIsInitialLoad(false);
        return;
      }
      
      // Load wealth data for all profiles in batch
      const profileIds = (profiles || []).map(p => p.id);
      let wealthDataMap: Record<string, any> = {};
      
      if (profileIds.length > 0) {
        // Use RPC function to get wealth data for badge display (bypasses RLS)
        const { data: wealthData, error: wealthError } = await supabase
          .rpc('get_members_wealth_for_badges', { member_ids: profileIds });
        
        if (wealthError) {
          console.error('Error loading wealth data:', wealthError);
        }
        
        if (wealthData) {
          wealthData.forEach((w: any) => {
            wealthDataMap[w.user_id] = w;
          });
          console.log(`[Members] Loaded wealth data for ${wealthData.length} members`);
        } else {
          console.log('[Members] No wealth data found');
        }
      }
      
      // Transform results with wealth data
      const transformedMembers = (profiles || []).map(profile => {
        const wealth = wealthDataMap[profile.id];
        const wealthBillions = wealth?.wealth_billions || null;
        const wealthNumeric = wealthBillions ? parseFloat(wealthBillions) : 0;
        const badge = calculateBadgeFromWealth(wealthBillions);
        
        // Debug: log members with wealth data
        if (wealthBillions) {
          console.log(`[Members] Member ${profile.first_name} ${profile.last_name} has wealth: ${wealthBillions} Md, badge: ${badge}`);
        }
        
        return {
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          honorific_title: profile.honorific_title,
          title: profile.job_function || t('member'),
          industry: profile.activity_domain || 'N/A',
          location: profile.country || 'N/A',
          avatar: profile.first_name?.charAt(0) || 'M',
          avatar_url: profile.avatar_url,
          badge: badge,
          is_founder: profile.is_founder || false,
          is_patron: profile.is_patron || false,
          identity_verified: profile.identity_verified || false,
          wealth_billions: wealthBillions,
          wealth_amount: wealth?.wealth_amount || null,
          wealth_unit: wealth?.wealth_unit || null,
          wealth_currency: wealth?.wealth_currency || null,
          wealth_numeric: wealthNumeric,
          friends: [],
          connections_count: userFriendIdsCache.includes(profile.id) ? 1 : 0
        };
      });
      
      setMembers(transformedMembers);
      setIsInitialLoad(false);
    };
    
    loadMembers();
  }, [isUserDataLoaded, userId, industryFilter, locationFilter, searchTerm, showOnlyConnections, userFriendIdsCache, t]);

  // Filtering: server-side filters + client-side filters for circle and wealth sort
  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      // Circle filter (client-side because it depends on calculated badge)
      if (circleFilter !== "all") {
        if (member.badge !== circleFilter) {
          return false;
        }
      }
      
      // Friend filters (client-side) - currently not used but kept for future
      const friendNameMatch = !friendNameFilter || friendNameFilter === "all" || member.friends?.includes(friendNameFilter);
      const friendWealthMatch = !friendWealthFilter || friendWealthFilter === "all" || member.friends?.includes(friendWealthFilter);
      
      return friendNameMatch && friendWealthMatch;
    });
  }, [members, circleFilter, friendNameFilter, friendWealthFilter]);
  
  // Apply wealth sort if selected
  const sortedMembers = React.useMemo(() => {
    if (wealthSort === "none") return filteredMembers;
    
    const sorted = [...filteredMembers].sort((a, b) => {
      if (wealthSort === "asc") {
        return a.wealth_numeric - b.wealth_numeric;
      } else {
        return b.wealth_numeric - a.wealth_numeric;
      }
    });
    return sorted;
  }, [filteredMembers, wealthSort]);
  
  // Calculate total pages based on filtered and sorted members
  const totalFilteredPages = React.useMemo(() => {
    return Math.ceil(sortedMembers.length / membersPerPage);
  }, [sortedMembers.length, membersPerPage]);
  
  // Apply pagination to sorted members
  const paginatedMembers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    return sortedMembers.slice(startIndex, endIndex);
  }, [sortedMembers, currentPage, membersPerPage]);
  
  // Update totalPages when filtered members change
  React.useEffect(() => {
    setTotalPages(totalFilteredPages);
    // Reset to page 1 if current page is out of bounds
    if (currentPage > totalFilteredPages && totalFilteredPages > 0) {
      setCurrentPage(1);
    }
  }, [totalFilteredPages, currentPage]);
  
  // Reset to page 1 when filters change - use a ref to prevent loops
  const prevFiltersRef = React.useRef<string>("");
  React.useEffect(() => {
    const currentFilters = JSON.stringify({searchTerm, industryFilter, locationFilter, wealthSort, circleFilter, friendNameFilter, friendWealthFilter, showOnlyConnections});
    if (prevFiltersRef.current && prevFiltersRef.current !== currentFilters && currentPage !== 1) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = currentFilters;
  }, [searchTerm, industryFilter, locationFilter, wealthSort, circleFilter, friendNameFilter, friendWealthFilter, showOnlyConnections, currentPage]);

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "diamond":
        return "text-blue-400";
      case "gold":
        return "text-yellow-400";
      case "platinum":
        return "text-gray-300";
      default:
        return "text-transparent";
    }
  };

  const getBadgeSymbol = (badge: string) => {
    switch (badge) {
      case "diamond":
        return "💎";
      case "gold":
        return "⭐";
      case "platinum":
        return "🏆";
      default:
        return "";
    }
  };
  
  const handleMemberClick = (member: any) => {
    // Vérifier si c'est déjà une relation acceptée
    if (userFriendships.includes(member.id)) {
      // Navigation vers le profil du membre connecté
      navigate(`/profile/${member.id}`);
      return;
    }
    
    const memberLevel = badgeHierarchy[member.badge];
    const currentLevel = badgeHierarchy[currentUserBadge];
    
    if (memberLevel > currentLevel) {
      // Membre d'un cercle supérieur
      setSelectedMember(member);
      setShowUpgradeDialog(true);
    } else {
      // Même cercle ou inférieur - afficher dialogue de connexion
      setSelectedMember(member);
    }
  };
  
  const handleConnectionRequest = async (member: Member) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('userNotConnected'));
        return;
      }

      // Use the member ID directly instead of searching by name
      const recipientId = member.id;

      if (!recipientId) {
        toast.error(t('memberNotFound'));
        return;
      }

      // Prevent self-connection
      if (recipientId === user.id) {
        toast.error(t('cannotSendToYourself'));
        return;
      }

      // Check if a pending request already exists
      const { data: existingRequest } = await supabase
        .from('connection_requests')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast.error(t('requestAlreadyPending'));
        return;
      }

      // Create connection request
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error(t('requestAlreadySent'));
        } else {
          throw error;
        }
        return;
      }

      // Get current user's profile for notification
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const requesterName = currentUserProfile 
        ? `${currentUserProfile.first_name} ${currentUserProfile.last_name}`
        : t('aMember');

      // Create notification for recipient
      await supabase
        .from('user_notifications')
        .insert({
          user_id: recipientId,
          type: 'connection_request',
          title: t('newConnectionRequest'),
          message: `${requesterName} ${t('wantsToConnect')}`
        });

      setConnectionStatus(prev => ({ ...prev, [member.name]: "pending" }));
      setSelectedMember(null);
      toast.success(t('requestSent'));
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(t('sendingError'));
    }
  };
  
  const handleUpgrade = (badge: string) => {
    setShowUpgradeDialog(false);
    navigate(`/payment?badge=${badge}&amount=${badgePrices[badge]}`);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[hsl(var(--navy-blue-light))] text-gold px-4 sm:px-6 pt-20 sm:pt-24 pb-8 safe-area-all">
        <div className="max-w-7xl mx-auto">
          {/* Connection Requests Section */}
          <div className="mb-6 sm:mb-8">
            <ConnectionRequests />
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center">
              <PageHeaderBackButton />
              <h1 className="text-2xl sm:text-4xl font-serif text-gold tracking-wide">{t('membersTitle')}</h1>
            </div>
          </div>

          {/* Search Bar and Filters */}
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gold/40" />
                <Input
                  type="text"
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 border-gold/20 text-gold placeholder:text-gold/40 focus:border-gold/50"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gold/30 text-gold/70 hover:bg-gold/10 w-full sm:w-auto"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {t('filters')}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="space-y-4">
                {/* Show only connections toggle */}
                <div className="p-3 sm:p-4 bg-black/30 border border-gold/20 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyConnections}
                      onChange={(e) => setShowOnlyConnections(e.target.checked)}
                      className="w-4 h-4 rounded border-gold/30 bg-black/50 text-gold focus:ring-gold/50"
                    />
                    <span className="text-gold/90 font-medium text-sm sm:text-base">
                      {t('showOnlyRelations')} ({new Set(userFriendships).size})
                    </span>
                  </label>
                </div>
                
                {/* Other filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-black/30 border border-gold/20 rounded-lg">
                  <div>
                    <label className="text-gold/70 text-sm mb-2 block">{t('activitySector')}</label>
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                        <SelectValue placeholder={t('allIndustries')} />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-gold/20 max-h-[300px]">
                        <SelectItem value="all">{t('allIndustries')}</SelectItem>
                        {INDUSTRIES.map(industry => (
                          <SelectItem key={industry} value={industry} className="text-gold hover:bg-gold/10 focus:bg-gold/10">
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-gold/70 text-sm mb-2 block">{t('countryState')}</label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                        <SelectValue placeholder={t('allCountries')} />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-gold/20 max-h-[300px]">
                        <SelectItem value="all">{t('allCountries')}</SelectItem>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-gold/70 text-sm mb-2 block">{t('sortByWealth')}</label>
                    <Select value={wealthSort} onValueChange={setWealthSort}>
                      <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                        <SelectValue placeholder={t('noSort')} />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-gold/20">
                        <SelectItem value="none">{t('noSort')}</SelectItem>
                        <SelectItem value="asc">{t('ascending')} (⬆️)</SelectItem>
                        <SelectItem value="desc">{t('descending')} (⬇️)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-gold/70 text-sm mb-2 block">{t('circle')}</label>
                    <Select value={circleFilter} onValueChange={setCircleFilter}>
                      <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                        <SelectValue placeholder={t('allCircles')} />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-gold/20">
                        <SelectItem value="all">{t('allCircles')}</SelectItem>
                        <SelectItem value="gold">{t('goldCircle')}</SelectItem>
                        <SelectItem value="platinum">{t('platinumCircle')}</SelectItem>
                        <SelectItem value="diamond">{t('diamondCircle')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {!isInitialLoad && (
            <div className="mb-4 text-gold/60 text-sm">
              {sortedMembers.length} {t('membersFound')}
              {totalFilteredPages > 1 && ` • ${t('page')} ${currentPage} ${t('of')} ${totalFilteredPages}`}
            </div>
          )}

          {/* Members Grid - LinkedIn style */}
          {/* Loading Spinner */}
          {isInitialLoad && (
            <div className="flex justify-center items-center py-20">
              <div 
                className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"
              />
            </div>
          )}

          {/* Members Grid - LinkedIn style */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 ${isInitialLoad ? 'hidden' : ''}`}>
            {paginatedMembers.map((member, index) => (
              <MemberCard
                key={member.id || index}
                member={member}
                onClick={() => {
                  setSelectedMemberId(member.id);
                  handleMemberClick(member);
                }}
                status={connectionStatus[member.name]}
                isSelected={selectedMemberId === member.id}
                t={t}
              />
            ))}
          </div>

          {/* Pagination */}
          {!isInitialLoad && totalFilteredPages > 1 && (
            <div className="flex justify-center items-center gap-2 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gold/30 text-gold disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page 
                      ? "bg-gold text-black hover:bg-gold/90" 
                      : "border-gold/30 text-gold hover:bg-gold/10"
                    }
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1))}
                disabled={currentPage === totalFilteredPages}
                className="border-gold/30 text-gold disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Connection Dialog - Same Level or Lower */}
          {selectedMember && !showUpgradeDialog && (
            <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  {selectedMember.honorific_title && (
                    <p className="text-center text-sm font-serif text-primary/80 mb-1">
                      {selectedMember.honorific_title}
                    </p>
                  )}
                  <DialogTitle className="text-2xl font-serif text-primary">
                    {selectedMember.name}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {selectedMember.title} • {selectedMember.industry}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6">
                  <div className="flex items-center justify-center mb-6">
                    <Avatar className="w-24 h-24 border-2 border-primary">
                      <AvatarImage src={selectedMember.avatar_url} alt={selectedMember.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-3xl font-serif">
                        {selectedMember.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {selectedMember.badge !== "none" && (
                      <div className="absolute text-2xl ml-20 mt-16">
                        {getBadgeSymbol(selectedMember.badge)}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-center text-foreground mb-4">
                    {t('sendConnectionRequest')} {selectedMember.name} ?
                  </p>
                </div>

                <DialogFooter>
                  {connectionStatus[selectedMember.name] === "pending" ? (
                    <div className="w-full text-center py-2 px-4 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground font-medium">{t('pendingResponse')}</p>
                    </div>
                  ) : (
                    <Button
                      variant="premium"
                      className="w-full"
                      onClick={() => handleConnectionRequest(selectedMember)}
                    >
                      {t('connectionRequest')}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Upgrade Dialog - Higher Level */}
          {showUpgradeDialog && selectedMember && (
            <Dialog open={showUpgradeDialog} onOpenChange={() => setShowUpgradeDialog(false)}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-primary">
                    {t('upgradeRequired')}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {t('higherCircle')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-5xl">
                      {getBadgeSymbol(selectedMember.badge)}
                    </div>
                  </div>
                  
                  <p className="text-center text-foreground mb-6 leading-relaxed">
                    {t('contactRequirement')} <span className="font-semibold text-primary">{selectedMember.name}</span>, 
                    {t('sameLevelRequired')}
                    <br /><br />
                    {t('requiredLevel')} <span className="font-semibold text-primary capitalize">{selectedMember.badge}</span>
                    <br />
                    {t('amount')} <span className="font-semibold text-primary">{badgePrices[selectedMember.badge]}{t('perMonth')}</span>
                  </p>
                </div>

                <DialogFooter className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowUpgradeDialog(false)}
                  >
                    {t('refuse')}
                  </Button>
                  <Button
                    variant="premium"
                    className="flex-1"
                    onClick={() => handleUpgrade(selectedMember.badge)}
                  >
                    {t('validate')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Results Count */}
          <div className="mt-8 text-center">
            <p className="text-gold/60 text-sm">
              {sortedMembers.length} {sortedMembers.length > 1 ? t('membersShownPlural') : t('membersShown')} {sortedMembers.length > 1 ? t('displayedPlural') : t('displayed')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const MembersPage = () => (
  <LinkedAccountGuard section="members">
    <Members />
  </LinkedAccountGuard>
);

export default MembersPage;