import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CreateTestMembers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCreateMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-members');
      
      if (error) throw error;
      
      setResults(data);
      toast.success("Membres de test créés avec succès!");
    } catch (error: any) {
      console.error('Error creating test members:', error);
      toast.error("Erreur lors de la création des membres");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gold p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/members")}
            className="text-gold/60 hover:text-gold mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-4xl font-serif text-gold tracking-wide">
            Créer les Membres de Test
          </h1>
        </div>

        <div className="bg-black/50 border border-gold/20 rounded-lg p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-gold">
              9 Comptes de Test
            </h2>
            <p className="text-gold/70">
              Cette fonction va créer 9 comptes utilisateurs réels pour les membres fictifs:
            </p>
            <ul className="space-y-2 text-gold/60 ml-4">
              <li>• Alexandre du Roche</li>
              <li>• Abigail Sinclair</li>
              <li>• Johnathan Shaw</li>
              <li>• Victoria Bell</li>
              <li>• Oliver Hamilton</li>
              <li>• Isabella Rossi</li>
              <li>• Charlotte Montgomery</li>
              <li>• William King</li>
              <li>• Catherine Mitchell</li>
            </ul>
            <p className="text-gold/70 mt-4">
              <strong>Mot de passe pour tous les comptes:</strong> Test1234!
            </p>
            <p className="text-gold/60 text-sm">
              Les emails suivent le format: prenom.nom@aurora.com
            </p>
          </div>

          <Button
            onClick={handleCreateMembers}
            disabled={loading}
            className="w-full bg-gold text-black hover:bg-gold/90"
          >
            {loading ? "Création en cours..." : "Créer les Membres"}
          </Button>

          {results && (
            <div className="mt-6 p-4 bg-black/30 border border-gold/20 rounded-lg">
              <h3 className="text-gold mb-4">Résultats:</h3>
              <div className="space-y-2">
                {results.results?.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded ${
                      result.status === 'success'
                        ? 'bg-green-500/10 border border-green-500/30'
                        : result.status === 'partial'
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gold/80">{result.email}</span>
                      <span
                        className={`text-sm ${
                          result.status === 'success'
                            ? 'text-green-400'
                            : result.status === 'partial'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-400 mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-gold/60 text-sm mt-4">{results.info}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTestMembers;
