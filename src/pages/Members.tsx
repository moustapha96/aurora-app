import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Crown, Heart, Diamond, BadgeDollarSign, SlidersHorizontal, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConnectionRequests } from "@/components/ConnectionRequests";
import { WealthBadge } from "@/components/WealthBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { INDUSTRIES } from "@/lib/industries";
import { COUNTRIES } from "@/lib/countries";

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
              <span className="text-xs font-semibold">FONDATEUR</span>
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
              {member.wealth_numeric > 0 && (
                <WealthBadge 
                  wealthBillions={member.wealth_billions}
                  wealthAmount={member.wealth_amount}
                  wealthUnit={member.wealth_unit}
                  wealthCurrency={member.wealth_currency}
                  className="scale-75 absolute -bottom-2 -right-2"
                />
              )}
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
            
            {/* Badge de cercle (Diamond, Platinum, Gold) */}
            {member.badge !== "none" && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-lg">
                  {member.badge === "diamond" ? "💎" : member.badge === "platinum" ? "🏆" : "⭐"}
                </span>
                <span className="text-xs text-gold/60 font-medium uppercase">
                  {member.badge === "diamond" ? "Diamond" : member.badge === "platinum" ? "Platinum" : "Gold"}
                </span>
              </div>
            )}
            
            {/* Badge Patron */}
            {member.is_patron && (
              <Badge className="mt-1 bg-purple-600/20 text-purple-300 border-purple-400/30 px-2 py-0.5 text-xs">
                Patron
              </Badge>
            )}
            
            {/* Status badge */}
            {status && (
              <Badge variant="outline" className="mt-2 border-gold/30 text-gold/70">
                {status === "connected" ? (t('connected') || "Connecté") : status === "pending" ? (t('pending') || "En attente") : (t('connect') || "Se connecter")}
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
  const { id: profileId } = useParams<{ id?: string }>();
  const { settings } = useSettings();
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
  const [showOnlyConnections, setShowOnlyConnections] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const membersPerPage = 10;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [userFriendships, setUserFriendships] = useState<string[]>([]);
  const [currentUserBadge, setCurrentUserBadge] = useState<string>("gold");
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(false);
  const [viewingProfileName, setViewingProfileName] = useState<string>("");
  
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

  // Check URL params to auto-enable connections filter
  useEffect(() => {
    const showConnections = searchParams.get('showConnections');
    if (showConnections === 'true') {
      setShowOnlyConnections(true);
    }
  }, [searchParams]);
  
  React.useEffect(() => {
    const loadMembersAndCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Determine which profile's connections to load
      const targetProfileId = profileId || user?.id;
      const isOwnProfile = !profileId || profileId === user?.id;
      
      setViewingProfileId(targetProfileId || null);
      
      // If viewing another user's connections, check access
      if (!isOwnProfile && user && targetProfileId) {
        setIsCheckingAccess(true);
        
        // Check if we are friends with this user and have network_access
        const { data: friendships } = await supabase
          .from('friendships')
          .select('network_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${targetProfileId}),and(user_id.eq.${targetProfileId},friend_id.eq.${user.id})`);
        
        if (!friendships || friendships.length === 0 || !friendships[0]?.network_access) {
          setHasAccess(false);
          setIsCheckingAccess(false);
          setIsInitialLoad(false);
          
          // Load profile name for error message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', targetProfileId)
            .single();
          
          if (profileData) {
            setViewingProfileName(`${profileData.first_name} ${profileData.last_name}`);
          }
          return;
        }
        setHasAccess(true);
        
        // Load profile name for header
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', targetProfileId)
          .single();
        
        if (profileData) {
          setViewingProfileName(`${profileData.first_name} ${profileData.last_name}`);
        }
      } else {
        setHasAccess(true);
        setViewingProfileName("");
      }
      setIsCheckingAccess(false);
      
      if (!user) {
        console.log('No user found, loading all members');
        // If no user, load all members without filtering
        const offset = (currentPage - 1) * membersPerPage;
        
        let query = supabase
          .from('profiles')
          .select('id, first_name, last_name, honorific_title, job_function, activity_domain, country, is_founder, is_patron, wealth_amount, wealth_unit, wealth_billions, wealth_currency, avatar_url', { count: 'exact' })
          .range(offset, offset + membersPerPage - 1);
        
        if (industryFilter !== "all") {
          query = query.eq('activity_domain', industryFilter);
        }
        
        if (locationFilter && locationFilter !== "all") {
          query = query.eq('country', locationFilter);
        }
        
        if (searchTerm) {
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,job_function.ilike.%${searchTerm}%`);
        }
        
        if (wealthSort === "asc") {
          query = query.order('wealth_amount', { ascending: true, nullsFirst: false });
        } else if (wealthSort === "desc") {
          query = query.order('wealth_amount', { ascending: false, nullsFirst: false });
        }
        
        const { data: profiles, error, count } = await query;
        
        if (error) {
          console.error('Error loading profiles:', error);
          setIsInitialLoad(false);
          return;
        }
        
        console.log('Loaded profiles:', profiles?.length, 'Total count:', count);
        
        const transformedMembers = (profiles || []).map(profile => ({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          honorific_title: profile.honorific_title,
          title: profile.job_function || 'Member',
          industry: profile.activity_domain || 'N/A',
          location: profile.country || 'N/A',
          avatar: profile.first_name?.charAt(0) || 'M',
          avatar_url: profile.avatar_url,
          badge: 'none',
          is_founder: profile.is_founder || false,
          is_patron: profile.is_patron || false,
          wealth_billions: profile.wealth_billions,
          wealth_amount: profile.wealth_amount,
          wealth_unit: profile.wealth_unit,
          wealth_currency: profile.wealth_currency,
          wealth_numeric: parseFloat(profile.wealth_amount) || 0,
          friends: [],
          connections_count: 0
        }));
        
        setMembers(transformedMembers);
        setTotalPages(Math.ceil((count || 0) / membersPerPage));
        setIsInitialLoad(false);
        return;
      }
      
      setCurrentUserProfile({ id: user.id });
      
      // Load current user's profile to determine their badge/circle
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wealth_billions')
        .eq('id', user.id)
        .single();
      
      if (!profileError && userProfile?.wealth_billions) {
        setCurrentUserBadge(calculateBadgeFromWealth(userProfile.wealth_billions));
      } else {
        setCurrentUserBadge("none");
      }
      
      // Load friendships to get target profile's friend IDs for filtering
      // If viewing another user's profile, load their connections
      const { data: allFriendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id');
      
      const targetFriendIds: string[] = [];
      if (allFriendships && targetProfileId) {
        allFriendships.forEach(friendship => {
          if (friendship.user_id === targetProfileId) {
            targetFriendIds.push(friendship.friend_id);
          } else if (friendship.friend_id === targetProfileId) {
            targetFriendIds.push(friendship.user_id);
          }
        });
      }
      
      // Also track current user's friendships for connection status
      const currentUserFriendIds: string[] = [];
      if (allFriendships && user) {
        allFriendships.forEach(friendship => {
          if (friendship.user_id === user.id) {
            currentUserFriendIds.push(friendship.friend_id);
          } else if (friendship.friend_id === user.id) {
            currentUserFriendIds.push(friendship.user_id);
          }
        });
      }
      
      setUserFriendships(isOwnProfile ? targetFriendIds : currentUserFriendIds);
      
      // OPTIMISATION: Load only necessary data with pagination
      // Calculate offset based on current page and filters
      const offset = (currentPage - 1) * membersPerPage;
      
      // Build query with filters applied server-side
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, honorific_title, job_function, activity_domain, country, is_founder, is_patron, wealth_amount, wealth_unit, wealth_billions, wealth_currency, avatar_url', { count: 'exact' });
      
      // Exclude the target profile from results (whether it's own profile or another user's)
      if (targetProfileId) {
        query = query.neq('id', targetProfileId);
      }
      
      // If viewing another user's profile, always show only their connections
      // Otherwise, apply "show only connections" filter if enabled
      if (!isOwnProfile && targetProfileId) {
        // Viewing another user's connections - show only their friends
        if (targetFriendIds.length > 0) {
          query = query.in('id', targetFriendIds);
        } else {
          // No connections, return empty result
          query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible ID to return empty
        }
      } else if (showOnlyConnections && targetFriendIds.length > 0) {
        // Viewing own profile with connections filter
        query = query.in('id', targetFriendIds);
      }
      
      query = query.range(offset, offset + membersPerPage - 1);
      
      // Apply server-side filters
      if (industryFilter !== "all") {
        console.log('Applying industry filter:', industryFilter);
        query = query.eq('activity_domain', industryFilter);
      }
      
      // Apply location filter server-side only if a country is selected
      if (locationFilter && locationFilter !== "all") {
        query = query.eq('country', locationFilter);
      }
      
      // Apply search filter server-side using full-text search
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,job_function.ilike.%${searchTerm}%`);
      }
      
      // Apply wealth sorting server-side
      if (wealthSort === "asc") {
        query = query.order('wealth_amount', { ascending: true, nullsFirst: false });
      } else if (wealthSort === "desc") {
        query = query.order('wealth_amount', { ascending: false, nullsFirst: false });
      }
      
      // Apply circle filter server-side based on wealth_billions
      if (circleFilter !== "all") {
        if (circleFilter === "gold") {
          // Gold: 10M€ à 30M€ (0.01 à 0.03 Md)
          query = query.gte('wealth_billions', '0.01').lt('wealth_billions', '0.03');
        } else if (circleFilter === "platinum") {
          // Platinum: 30M€ à 100M€ (0.03 à 0.1 Md)
          query = query.gte('wealth_billions', '0.03').lte('wealth_billions', '0.1');
        } else if (circleFilter === "diamond") {
          // Diamond: > 100M€ (> 0.1 Md)
          query = query.gt('wealth_billions', '0.1');
        }
      }
      
      const { data: profiles, error, count } = await query;
      
      if (error) {
        console.error('Error loading profiles:', error);
        setIsInitialLoad(false);
        return;
      }
      
      console.log('Loaded profiles:', profiles?.length, 'Total count:', count);
      console.log('Applied filters - Industry:', industryFilter, 'Location:', locationFilter, 'Search:', searchTerm);
      
      // Calculate connections count (reuse allFriendships loaded earlier)
      const connectionsCount: { [key: string]: Set<string> } = {};
      
      if (allFriendships) {
        allFriendships.forEach(friendship => {
          // Initialize sets if needed
          if (!connectionsCount[friendship.user_id]) {
            connectionsCount[friendship.user_id] = new Set();
          }
          if (!connectionsCount[friendship.friend_id]) {
            connectionsCount[friendship.friend_id] = new Set();
          }
          
          // Add only one direction to avoid double counting (since table has bidirectional entries)
          // We always add the friend_id to user_id's set
          connectionsCount[friendship.user_id].add(friendship.friend_id);
        });
      }
      
      // Transform ONLY the paginated results
      const transformedMembers = (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        honorific_title: profile.honorific_title,
        title: profile.job_function || 'Member',
        industry: profile.activity_domain || 'N/A',
        location: profile.country || 'N/A',
        avatar: profile.first_name?.charAt(0) || 'M',
        avatar_url: profile.avatar_url,
        badge: calculateBadgeFromWealth(profile.wealth_billions),
        is_founder: profile.is_founder || false,
        is_patron: profile.is_patron || false,
        wealth_billions: profile.wealth_billions,
        wealth_amount: profile.wealth_amount,
        wealth_unit: profile.wealth_unit,
        wealth_currency: profile.wealth_currency,
        wealth_numeric: parseFloat(profile.wealth_amount) || 0,
        friends: [],
        connections_count: connectionsCount[profile.id]?.size || 0
      }));
      
      setMembers(transformedMembers);
      setTotalPages(Math.ceil((count || 0) / membersPerPage));
      setIsInitialLoad(false);
    };
    
    loadMembersAndCurrentUser();
  }, [currentPage, industryFilter, locationFilter, searchTerm, wealthSort, circleFilter, showOnlyConnections, profileId]);

  // OPTIMISATION: Filtering is now mostly done server-side
  // Only client-side filters remaining are for complex friend filters (if needed in future)
  const filteredMembers = members.filter(member => {
    // showOnlyConnections is now handled server-side, no need to filter again here
    
    // Friend filters (client-side) - currently not used but kept for future
    const friendNameMatch = !friendNameFilter || friendNameFilter === "all" || member.friends?.includes(friendNameFilter);
    const friendWealthMatch = !friendWealthFilter || friendWealthFilter === "all" || member.friends?.includes(friendWealthFilter);
    
    return friendNameMatch && friendWealthMatch;
  });
  
  // Pagination is now handled server-side
  const paginatedMembers = filteredMembers;
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, industryFilter, locationFilter, wealthSort, circleFilter, friendNameFilter, friendWealthFilter, showOnlyConnections]);

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
  
  const handleConnectionRequest = async (memberName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('error'));
        return;
      }

      // Get recipient profile by name
      const nameParts = memberName.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (profileError || !recipientProfile) {
        toast.error(t('error'));
        return;
      }

      // Prevent self-connection
      if (recipientProfile.id === user.id) {
        toast.error(t('error'));
        return;
      }

      // Create connection request
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: recipientProfile.id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error(t('error'));
        } else {
          throw error;
        }
        return;
      }

      setConnectionStatus(prev => ({ ...prev, [memberName]: "pending" }));
      setSelectedMember(null);
      toast.success(t('success'));
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(t('error'));
    }
  };
  
  const handleUpgrade = (badge: string) => {
    setShowUpgradeDialog(false);
    navigate(`/payment?badge=${badge}&amount=${badgePrices[badge]}`);
  };

  // Show access denied message if viewing another user's connections without permission
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-[hsl(var(--navy-blue-light))] text-gold p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gold/80 text-lg">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess && viewingProfileId) {
    return (
      <div className="min-h-screen bg-[hsl(var(--navy-blue-light))] text-gold p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/profile/${viewingProfileId}`)}
              className="text-gold/60 hover:text-gold mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
            <h1 className="text-4xl font-serif text-gold tracking-wide">
              {viewingProfileName ? `MEMBRES DE ${viewingProfileName.toUpperCase()}` : 'MEMBERS'}
            </h1>
          </div>
          <div className="bg-black/50 border border-gold/20 rounded-lg p-8 text-center">
            <p className="text-gold/80 text-lg mb-4">
              Accès refusé
            </p>
            <p className="text-gold/60">
              Vous n'avez pas la permission de voir les connexions de {viewingProfileName || 'ce membre'}.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/profile/${viewingProfileId}`)}
              className="mt-6 border-gold/30 text-gold hover:bg-gold/10"
            >
              Retour au profil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--navy-blue-light))] text-gold p-6">
      <div className="max-w-7xl mx-auto">
        {/* Connection Requests Section - Only for own profile */}
        {!profileId && (
          <div className="mb-8">
            <ConnectionRequests />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => profileId ? navigate(`/profile/${profileId}`) : navigate("/member-card")}
              className="text-gold/60 hover:text-gold mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
            <h1 className="text-4xl font-serif text-gold tracking-wide">
              {viewingProfileName ? `MEMBRES DE ${viewingProfileName.toUpperCase()}` : 'MEMBERS'}
            </h1>
          </div>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gold/40" />
              <Input
                type="text"
                placeholder="Rechercher par nom, prénom, secteur, pays ou relations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/50 border-gold/20 text-gold placeholder:text-gold/40 focus:border-gold/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gold/30 text-gold/70 hover:bg-gold/10"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4">
              {/* Show only connections toggle - Only for own profile */}
              {!profileId && (
                <div className="p-4 bg-black/30 border border-gold/20 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyConnections}
                      onChange={(e) => setShowOnlyConnections(e.target.checked)}
                      className="w-4 h-4 rounded border-gold/30 bg-black/50 text-gold focus:ring-gold/50"
                    />
                    <span className="text-gold/90 font-medium">
                      Afficher uniquement mes relations ({new Set(userFriendships).size})
                    </span>
                  </label>
                </div>
              )}
              
              {/* Other filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-black/30 border border-gold/20 rounded-lg">
                <div>
                  <label className="text-gold/70 text-sm mb-2 block">Secteur d'activité</label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                      <SelectValue placeholder="Tous les secteurs" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gold/20 max-h-[300px]">
                      <SelectItem value="all">Tous les secteurs</SelectItem>
                      {INDUSTRIES.map(industry => (
                        <SelectItem key={industry} value={industry} className="text-gold hover:bg-gold/10 focus:bg-gold/10">
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-gold/70 text-sm mb-2 block">Pays/État</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gold/20 max-h-[300px]">
                      <SelectItem value="all">Tous les pays</SelectItem>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-gold/70 text-sm mb-2 block">Tri par patrimoine</label>
                  <Select value={wealthSort} onValueChange={setWealthSort}>
                    <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                      <SelectValue placeholder="Aucun tri" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gold/20">
                      <SelectItem value="none">Aucun tri</SelectItem>
                      <SelectItem value="asc">Croissant (⬆️)</SelectItem>
                      <SelectItem value="desc">Décroissant (⬇️)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-gold/70 text-sm mb-2 block">Cercle</label>
                  <Select value={circleFilter} onValueChange={setCircleFilter}>
                    <SelectTrigger className="bg-black/50 border-gold/20 text-gold">
                      <SelectValue placeholder="Tous les cercles" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gold/20">
                      <SelectItem value="all">Tous les cercles</SelectItem>
                      <SelectItem value="gold">Gold (10M€ - 30M€)</SelectItem>
                      <SelectItem value="platinum">Platinum (30M€ - 100M€)</SelectItem>
                      <SelectItem value="diamond">Diamond (&gt; 100M€)</SelectItem>
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
            {filteredMembers.length} {filteredMembers.length > 1 ? t('membersShownPlural') : t('membersShown')} {filteredMembers.length > 1 ? t('displayedPlural') : t('displayed')}
            {totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
          </div>
        )}

        {/* Members Grid - LinkedIn style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {isInitialLoad ? (
            // Skeleton cards pendant le chargement initial
            Array.from({ length: membersPerPage }).map((_, index) => (
              <Card key={index} className="bg-[hsl(var(--navy-blue-light))] border-gold/20 overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-16 w-full bg-gold/10" />
                  <div className="relative px-6 pb-6">
                    <div className="flex justify-center -mt-12 mb-4">
                      <Skeleton className="w-24 h-24 rounded-full border-4 border-black" />
                    </div>
                    <div className="text-center space-y-2">
                      <Skeleton className="h-6 w-3/4 mx-auto bg-gold/10" />
                      <Skeleton className="h-4 w-2/3 mx-auto bg-gold/10" />
                      <Skeleton className="h-3 w-1/2 mx-auto bg-gold/10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            paginatedMembers.map((member, index) => (
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
            ))
          )}
        </div>

        {/* Pagination */}
        {!isInitialLoad && totalPages > 1 && (
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
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
                    onClick={() => handleConnectionRequest(selectedMember.name)}
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
            {filteredMembers.length} {filteredMembers.length > 1 ? t('membersShownPlural') : t('membersShown')} {filteredMembers.length > 1 ? t('displayedPlural') : t('displayed')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Members;