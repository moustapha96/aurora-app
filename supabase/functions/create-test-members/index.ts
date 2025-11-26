import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const testMembers = [
      {
        email: "alexandre.duroche@aurora.com",
        password: "Test1234!",
        first_name: "Alexandre",
        last_name: "du Roche",
        honorific_title: "CEO",
        job_function: "CEO",
        activity_domain: "Finance",
        mobile_phone: "+1234567890",
        is_founder: true,
        is_patron: true,
        wealth_billions: "4.5 Md"
      },
      {
        email: "abigail.sinclair@aurora.com",
        password: "Test1234!",
        first_name: "Abigail",
        last_name: "Sinclair",
        honorific_title: "Partner",
        job_function: "Partner",
        activity_domain: "Law",
        mobile_phone: "+1234567891",
        is_founder: false,
        is_patron: true,
        wealth_billions: "2.1 Md"
      },
      {
        email: "johnathan.shaw@aurora.com",
        password: "Test1234!",
        first_name: "Johnathan",
        last_name: "Shaw",
        honorific_title: "Managing Director",
        job_function: "Managing Director",
        activity_domain: "Investment",
        mobile_phone: "+1234567892",
        is_founder: true,
        is_patron: false,
        wealth_billions: "1.8 Md"
      },
      {
        email: "victoria.bell@aurora.com",
        password: "Test1234!",
        first_name: "Victoria",
        last_name: "Bell",
        honorific_title: "Senior Partner",
        job_function: "Senior Partner",
        activity_domain: "Consulting",
        mobile_phone: "+1234567893",
        is_founder: false,
        is_patron: false,
        wealth_billions: null
      },
      {
        email: "oliver.hamilton@aurora.com",
        password: "Test1234!",
        first_name: "Oliver",
        last_name: "Hamilton",
        honorific_title: "Entrepreneur",
        job_function: "Entrepreneur",
        activity_domain: "Technology",
        mobile_phone: "+1234567894",
        is_founder: false,
        is_patron: false,
        wealth_billions: null
      },
      {
        email: "isabella.rossi@aurora.com",
        password: "Test1234!",
        first_name: "Isabella",
        last_name: "Rossi",
        honorific_title: "CEO",
        job_function: "CEO",
        activity_domain: "Luxury",
        mobile_phone: "+1234567895",
        is_founder: false,
        is_patron: true,
        wealth_billions: "3.2 Md"
      },
      {
        email: "charlotte.montgomery@aurora.com",
        password: "Test1234!",
        first_name: "Charlotte",
        last_name: "Montgomery",
        honorific_title: "Director",
        job_function: "Director",
        activity_domain: "Media",
        mobile_phone: "+1234567896",
        is_founder: false,
        is_patron: false,
        wealth_billions: null
      },
      {
        email: "william.king@aurora.com",
        password: "Test1234!",
        first_name: "William",
        last_name: "King",
        honorific_title: "President",
        job_function: "President",
        activity_domain: "Real Estate",
        mobile_phone: "+1234567897",
        is_founder: true,
        is_patron: false,
        wealth_billions: null
      },
      {
        email: "catherine.mitchell@aurora.com",
        password: "Test1234!",
        first_name: "Catherine",
        last_name: "Mitchell",
        honorific_title: "Founder",
        job_function: "Founder",
        activity_domain: "Fashion",
        mobile_phone: "+1234567898",
        is_founder: false,
        is_patron: false,
        wealth_billions: null
      }
    ]

    const memberContent = {
      "alexandre.duroche@aurora.com": {
        family_content: {
          bio: "Visionnaire de la finance, Alexandre a révolutionné l'investissement européen. Diplômé de HEC Paris et Harvard Business School, il a fondé Aurora Capital à 28 ans.",
          family_text: "Marié à Marguerite du Roche, philanthrope et collectionneuse d'art. Trois enfants : Augustin (24 ans), Camille (21 ans) et Louis (18 ans).",
          residences_text: "Hôtel particulier avenue Foch (Paris), château en Bourgogne, villa à Cap d'Antibes, penthouse à Monaco.",
          philanthropy_text: "Président de la Fondation Aurora pour l'entrepreneuriat, finance des incubateurs pour jeunes entrepreneurs issus de quartiers défavorisés.",
          personal_quote: "Le luxe ultime, c'est le temps et l'impact qu'on laisse."
        },
        curated_sports: [
          { sport_type: "polo", title: "Polo international", subtitle: "Polo Club de Paris", description: "Compétition de haut niveau en France et Argentine", stat1_label: "Handicap", stat1_value: "5 goals", stat2_label: "Chevaux", stat2_value: "12" },
          { sport_type: "sailing", title: "Yachting de luxe", subtitle: "Méditerranée", description: "Régate et navigation de prestige", stat1_label: "Yacht", stat1_value: "45m", stat2_label: "Régates", stat2_value: "8/an" }
        ],
        artwork_collection: [
          { title: "Les Nymphéas", artist: "Claude Monet", year: "1919", medium: "Huile sur toile", price: "Collection privée", acquisition: "Héritage familial", description: "Étude rare de la série emblématique" },
          { title: "Portrait de Dora Maar", artist: "Pablo Picasso", year: "1937", medium: "Huile sur toile", price: "65M €", acquisition: "2019", description: "Période cubiste, portrait de la muse" }
        ],
        social_influence: [
          { platform: "Forbes", metric: "Ranking", value: "#127", description: "Milliardaires mondiaux 2024" },
          { platform: "LinkedIn", metric: "Followers", value: "850K", description: "Leadership & finance" }
        ]
      },
      "abigail.sinclair@aurora.com": {
        family_content: {
          bio: "Avocate internationale spécialisée en droit des affaires, Abigail a fait ses études à Oxford avant de rejoindre le cabinet prestigieux Clifford Chance à Londres.",
          family_text: "Mariée à James Sinclair, chirurgien renommé à Boston. Deux enfants : Emma (15 ans) et Thomas (12 ans).",
          residences_text: "Penthouse à Manhattan, propriété familiale dans les Cotswolds (Angleterre), villa à Saint-Barthélemy.",
          philanthropy_text: "Membre du conseil d'administration de l'UNICEF, finance des programmes d'éducation pour jeunes filles en Afrique subsaharienne.",
          personal_quote: "Justice and elegance are not mutually exclusive."
        },
        social_influence: [
          { platform: "LinkedIn", metric: "Connections", value: "25K+", description: "Réseau professionnel international" },
          { platform: "Speaking", metric: "Conférences", value: "40+/an", description: "Forums juridiques mondiaux" }
        ],
        sports_hobbies: [
          { title: "Équitation", description: "Championne régionale de dressage", badge_text: "Médaillée" },
          { title: "Œnologie", description: "Sommelière certifiée", badge_text: "Expert" }
        ]
      },
      "johnathan.shaw@aurora.com": {
        family_content: {
          bio: "Directeur de fonds d'investissement spécialisé dans les technologies vertes. Diplômé de Stanford, pionnier de l'investissement impact.",
          family_text: "Célibataire, très proche de sa sœur Sarah qui dirige une ONG environnementale.",
          residences_text: "Loft à San Francisco, chalet à Aspen, appartement à Singapour.",
          philanthropy_text: "Co-fondateur de Green Future Fund, investit dans des startups cleantech dans les pays émergents.",
          personal_quote: "Profit with purpose is the future of capitalism."
        },
        curated_sports: [
          { sport_type: "sailing", title: "Voile océanique", subtitle: "Régate Transpacifique", description: "Navigation hauturière et compétition internationale", stat1_label: "Courses", stat1_value: "12", stat2_label: "Podiums", stat2_value: "5" },
          { sport_type: "skiing", title: "Ski freeride", subtitle: "Alpes & Rocheuses", description: "Descentes hors-piste dans les massifs mythiques", stat1_label: "Sommets", stat1_value: "50+", stat2_label: "Saison", stat2_value: "80 jours" }
        ],
        social_influence: [
          { platform: "Twitter", metric: "Followers", value: "180K", description: "Influence tech & finance verte" },
          { platform: "TED", metric: "Talks", value: "3", description: "Innovation & durabilité" }
        ]
      },
      "victoria.bell@aurora.com": {
        family_content: {
          bio: "Consultante stratégique senior chez McKinsey, spécialisée dans la transformation digitale des entreprises du Fortune 500.",
          family_text: "Mariée à David Bell, architecte. Un fils adoptif, Lucas (8 ans), originaire du Vietnam.",
          residences_text: "Townhouse à Londres (Notting Hill), maison de campagne en Provence, pied-à-terre à Singapour.",
          philanthropy_text: "Ambassadrice de l'adoption internationale, soutient des orphelinats en Asie du Sud-Est.",
          personal_quote: "Excellence is a habit, not an event."
        },
        sports_hobbies: [
          { title: "Yoga & Méditation", description: "Pratique quotidienne et retraites spirituelles", badge_text: "Certifiée" },
          { title: "Photographie d'art", description: "Expositions collectives à Londres et Paris", badge_text: "Artiste" }
        ],
        social_influence: [
          { platform: "Instagram", metric: "Followers", value: "95K", description: "Lifestyle & wellness" },
          { platform: "Medium", metric: "Lecteurs", value: "150K/mois", description: "Leadership féminin" }
        ]
      },
      "oliver.hamilton@aurora.com": {
        family_content: {
          bio: "Entrepreneur tech, fondateur de trois startups dont deux licornes dans l'IA et la cybersécurité. Considéré comme l'un des innovateurs majeurs de sa génération.",
          family_text: "En couple avec Sophie Chen, designer industrielle. Pas d'enfants, par choix.",
          residences_text: "Penthouse à Berlin, ranch high-tech au Texas, appartement à Tokyo.",
          philanthropy_text: "Finance des programmes de coding pour jeunes défavorisés, mentor dans plusieurs incubateurs.",
          personal_quote: "Code the future you want to live in."
        },
        curated_sports: [
          { sport_type: "motorsport", title: "Pilotage GT", subtitle: "Circuit Paul Ricard", description: "Compétition automobile sur circuits européens", stat1_label: "Courses", stat1_value: "24", stat2_label: "Pole positions", stat2_value: "3" },
          { sport_type: "aviation", title: "Aviation privée", subtitle: "Pilote certifié", description: "Vol VFR/IFR, propriétaire d'un Cirrus SR22", stat1_label: "Heures de vol", stat1_value: "850+", stat2_label: "Licences", stat2_value: "Multi-engine" }
        ],
        social_influence: [
          { platform: "YouTube", metric: "Subscribers", value: "420K", description: "Tech reviews & innovation" },
          { platform: "Podcast", metric: "Downloads", value: "2M+", description: "Future of Tech podcast" }
        ]
      },
      "isabella.rossi@aurora.com": {
        family_content: {
          bio: "PDG de la maison de luxe Rossi Heritage, empire familial fondé en 1847 à Florence. A modernisé la marque tout en préservant son héritage artisanal.",
          family_text: "Veuve de Marco Benedetti (décédé 2020). Trois enfants : Giulia (22 ans), Leonardo (19 ans), Sofia (16 ans).",
          residences_text: "Palazzo familial à Florence, appartement avenue Montaigne (Paris), villa à Capri, penthouse à New York.",
          philanthropy_text: "Présidente de la Fondation Rossi pour la préservation du patrimoine artistique italien, finance la restauration d'œuvres d'art.",
          personal_quote: "Il lusso vero è fatto di tempo, non di denaro."
        },
        artwork_collection: [
          { title: "Primavera Moderna", artist: "Sandro Botticelli", year: "1478", medium: "Tempera sur bois", price: "Héritage familial", acquisition: "1847", description: "Étude préparatoire pour La Primavera" },
          { title: "Testa di Donna", artist: "Amedeo Modigliani", year: "1917", medium: "Huile sur toile", price: "45M €", acquisition: "2015", description: "Portrait caractéristique de la période parisienne" },
          { title: "Forme Uniche", artist: "Umberto Boccioni", year: "1913", medium: "Bronze", price: "Collection privée", acquisition: "Héritage", description: "Sculpture futuriste iconique" }
        ],
        social_influence: [
          { platform: "Vogue", metric: "Covers", value: "7", description: "Couvertures internationales" },
          { platform: "Instagram", metric: "Followers", value: "3.2M", description: "Luxury lifestyle influencer" }
        ]
      },
      "charlotte.montgomery@aurora.com": {
        family_content: {
          bio: "Réalisatrice et productrice primée, fondatrice de Montgomery Films. Trois Oscars, deux Golden Globes. Militante pour la diversité à Hollywood.",
          family_text: "Divorcée de l'acteur Ryan Cooper. Une fille, Lily (14 ans), qui aspire à devenir scénariste.",
          residences_text: "Villa à Beverly Hills, loft à Brooklyn, maison de plage à Malibu.",
          philanthropy_text: "Fondatrice de Women in Film Initiative, finance des bourses pour réalisatrices émergentes.",
          personal_quote: "Every story deserves to be told, every voice deserves to be heard."
        },
        sports_hobbies: [
          { title: "Surf", description: "Sessions quotidiennes à Malibu Point", badge_text: "Passionnée" },
          { title: "Boxe", description: "Entraînement avec champion WBC", badge_text: "Compétitrice" }
        ],
        social_influence: [
          { platform: "Hollywood Reporter", metric: "Top 100", value: "#12", description: "Most Powerful Women" },
          { platform: "Twitter", metric: "Followers", value: "2.1M", description: "Activisme & cinéma" }
        ]
      },
      "william.king@aurora.com": {
        family_content: {
          bio: "Magnat de l'immobilier de luxe, président de King Properties. A développé les gratte-ciels les plus emblématiques de Manhattan et Dubaï.",
          family_text: "Marié à Patricia King, philanthrope. Quatre enfants : William Jr. (28 ans), Alexandra (25 ans), Charles (22 ans), Elizabeth (19 ans).",
          residences_text: "Triplex à Trump Tower (Manhattan), château en Écosse, villa à Palm Beach, penthouse à Monaco.",
          philanthropy_text: "King Foundation soutient la construction de logements sociaux premium et l'architecture durable.",
          personal_quote: "Build legacies, not just buildings."
        },
        curated_sports: [
          { sport_type: "golf", title: "Golf championship", subtitle: "Augusta National Member", description: "Membre de clubs prestigieux, tournois internationaux", stat1_label: "Handicap", stat1_value: "4", stat2_label: "Clubs", stat2_value: "12 privés" },
          { sport_type: "polo", title: "Polo compétition", subtitle: "Hamptons Polo Club", description: "Tournois haute compétition sur la côte Est", stat1_label: "Handicap", stat1_value: "6 goals", stat2_label: "Chevaux", stat2_value: "18" }
        ],
        social_influence: [
          { platform: "Forbes", metric: "Real Estate Tycoon", value: "Top 20", description: "Liste mondiale" },
          { platform: "LinkedIn", metric: "Connections", value: "40K+", description: "Réseau immobilier global" }
        ]
      },
      "catherine.mitchell@aurora.com": {
        family_content: {
          bio: "Créatrice de mode visionnaire, fondatrice de la maison Mitchell Paris. Révolutionne la haute couture avec des matériaux durables et innovants.",
          family_text: "Célibataire, dédiée à sa carrière. Très proche de ses nièces jumelles qu'elle considère comme ses filles.",
          residences_text: "Hôtel particulier à Paris (Marais), loft à Milan, beach house aux Hamptons.",
          philanthropy_text: "Fashion for Tomorrow, programme de formation pour jeunes designers issus de milieux défavorisés.",
          personal_quote: "La mode est éphémère, le style est éternel, l'impact doit être positif."
        },
        artwork_collection: [
          { title: "Fashion Icon Series", artist: "Andy Warhol", year: "1982", medium: "Sérigraphie", price: "12M €", acquisition: "2018", description: "Série de portraits de figures de la mode" },
          { title: "Textile Study", artist: "Sonia Delaunay", year: "1925", medium: "Gouache et collage", price: "3.5M €", acquisition: "2019", description: "Étude pour robe simultanée" }
        ],
        sports_hobbies: [
          { title: "Danse contemporaine", description: "Cours privés avec chorégraphes du Bolshoi", badge_text: "Avancée" },
          { title: "Escrime", description: "Fleuret et épée, compétitions nationales", badge_text: "Championne" }
        ],
        social_influence: [
          { platform: "Instagram", metric: "Followers", value: "5.8M", description: "Fashion & sustainability" },
          { platform: "Vogue", metric: "Designer of Year", value: "2023", description: "Prix innovation" }
        ]
      }
    }

    const results = []

    for (const member of testMembers) {
      let userId: string | null = null

      // Try to find existing user first
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find(u => u.email === member.email)

      if (existingUser) {
        // User already exists, use existing ID
        userId = existingUser.id
        console.log(`User ${member.email} already exists, updating data...`)
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: member.email,
          password: member.password,
          email_confirm: true,
          user_metadata: {
            first_name: member.first_name,
            last_name: member.last_name
          }
        })

        if (authError) {
          console.error(`Error creating user ${member.email}:`, authError)
          results.push({ email: member.email, status: 'error', error: authError.message })
          continue
        }

        userId = authData.user.id
      }

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: member.first_name,
          last_name: member.last_name,
          honorific_title: member.honorific_title,
          job_function: member.job_function,
          activity_domain: member.activity_domain,
          mobile_phone: member.mobile_phone,
          is_founder: member.is_founder,
          is_patron: member.is_patron,
          wealth_billions: member.wealth_billions
        })
        .eq('id', userId)

      if (profileError) {
        console.error(`Error updating profile ${member.email}:`, profileError)
        results.push({ email: member.email, status: 'partial', userId, error: profileError.message })
        continue
      }

      // Add personalized content if exists
      const content = memberContent[member.email]
      if (content) {
        // Delete existing content first
        await supabaseAdmin.from('family_content').delete().eq('user_id', userId)
        await supabaseAdmin.from('social_influence').delete().eq('user_id', userId)
        await supabaseAdmin.from('sports_hobbies').delete().eq('user_id', userId)
        await supabaseAdmin.from('curated_sports').delete().eq('user_id', userId)
        await supabaseAdmin.from('artwork_collection').delete().eq('user_id', userId)

        // Add family content
        if (content.family_content) {
          await supabaseAdmin.from('family_content').insert({
            user_id: userId,
            ...content.family_content
          })
        }

        // Add social influence
        if (content.social_influence) {
          for (const item of content.social_influence) {
            await supabaseAdmin.from('social_influence').insert({
              user_id: userId,
              ...item
            })
          }
        }

        // Add sports hobbies
        if (content.sports_hobbies) {
          for (let i = 0; i < content.sports_hobbies.length; i++) {
            await supabaseAdmin.from('sports_hobbies').insert({
              user_id: userId,
              display_order: i,
              ...content.sports_hobbies[i]
            })
          }
        }

        // Add curated sports
        if (content.curated_sports) {
          for (let i = 0; i < content.curated_sports.length; i++) {
            await supabaseAdmin.from('curated_sports').insert({
              user_id: userId,
              ...content.curated_sports[i]
            })
          }
        }

        // Add artwork collection
        if (content.artwork_collection) {
          for (let i = 0; i < content.artwork_collection.length; i++) {
            await supabaseAdmin.from('artwork_collection').insert({
              user_id: userId,
              display_order: i,
              ...content.artwork_collection[i]
            })
          }
        }
      }

      results.push({ email: member.email, status: 'success', userId })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Test members creation completed',
        results,
        info: 'All accounts use password: Test1234!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-test-members:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
