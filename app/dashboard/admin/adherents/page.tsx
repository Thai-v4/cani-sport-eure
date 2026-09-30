"use client"; // Indique que ce composant s'exécute côté client

import { useEffect, useState, useMemo } from "react"; // Hooks React
import { useAuth } from "@/app/components/Auth/AuthProvider"; // Contexte d'authentification
import { useRouter } from "next/navigation"; // Navigation
import SidebarAdmin from "@/app/components/SidebarAdmin"; // Barre latérale admin
import { FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaUserPlus, FaChevronDown, FaChevronRight } from "react-icons/fa"; // Icônes d'édition, suppression, recherche et filtres
import ModalConfirm from "@/app/components/ModalConfirm"; // Modal de confirmation
import { motion, AnimatePresence } from "framer-motion"; // Animations

// Interface définissant la structure d'un utilisateur
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  license_number: string;
  administrateur: boolean;
  animateur: boolean;
  statut_inscription: "en attente" | "inscrit" | "refusé";
}

// 1. Créer un modèle par défaut pour un nouvel utilisateur
const defaultUserValues = {
  id: "",
  email: "",
  first_name: "",
  last_name: "",
  birthdate: "",
  license_number: "",
  administrateur: false,
  animateur: false,
  statut_inscription: "en attente" as const,
};

export default function ListeAdherents() {
  // États pour gérer les données et l'interface
  const [users, setUsers] = useState<User[]>([]); // Liste des utilisateurs
  const [search, setSearch] = useState(""); // Terme de recherche
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Utilisateur en cours d'édition
  const { user, role, isLoading } = useAuth(); // Données d'authentification
  const router = useRouter(); // Navigation
  const [userToDelete, setUserToDelete] = useState<User | null>(null); // Utilisateur à supprimer
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // État d'ouverture de la modal de suppression
  
  // Nouveaux états pour l'UI améliorée
  const [sortField, setSortField] = useState<keyof User | null>("last_name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [roleFilter, setRoleFilter] = useState<string>("tous");
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSuccessToastVisible, setIsSuccessToastVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Vérification de la taille de l'écran
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Redirection si non-admin
  useEffect(() => {
    if (!isLoading && (!user || role !== "admin")) {
      router.replace("/connexion");
    }
  }, [user, role, isLoading, router]);

  // Chargement des utilisateurs depuis l'API
  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    }

    if (user && role === "admin") {
      fetchUsers();
    }
  }, [user, role]);

  // Fonction pour afficher un message de succès temporaire
  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setIsSuccessToastVisible(true);
    setTimeout(() => setIsSuccessToastVisible(false), 3000);
  };

  // Fonction pour trier les données
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrage et tri des utilisateurs
  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Filtre de recherche
        const searchMatch = `${user.last_name} ${user.first_name}`
          .toLowerCase()
          .includes(search.toLowerCase());
        
        // Filtre par statut
        const statusMatch = statusFilter === "tous" || 
          user.statut_inscription === statusFilter;
        
        // Filtre par rôle
        const roleMatch = roleFilter === "tous" || 
          (roleFilter === "admin" && user.administrateur) ||
          (roleFilter === "animateur" && user.animateur) || // Missing operator here
          (roleFilter === "adherent" && !user.administrateur && !user.animateur); // Mise à jour
        
        return searchMatch && statusMatch && roleMatch;
      })
      .sort((a, b) => {
        if (!sortField) return 0;
        
        if (sortField === "last_name") {
          const fullNameA = `${a.last_name} ${a.first_name}`.toLowerCase();
          const fullNameB = `${b.last_name} ${b.first_name}`.toLowerCase();
          return sortDirection === 'asc' 
            ? fullNameA.localeCompare(fullNameB)
            : fullNameB.localeCompare(fullNameA);
        }
        
        const valueA = a[sortField]?.toString().toLowerCase() || '';
        const valueB = b[sortField]?.toString().toLowerCase() || '';
        
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      });
  }, [users, search, sortField, sortDirection, statusFilter, roleFilter]);

  // Enregistrement des modifications d'un utilisateur
  async function saveUserEdits() {
    if (!selectedUser) return;

    // Log pour déboguer

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedUser,
          animateur: !!selectedUser.animateur // S'assurer que c'est bien un booléen
        }),
      });

      if (res.ok) {
        // Mise à jour du state local
        setUsers((prev) =>
          prev.map((user) => (user.id === selectedUser.id ? selectedUser : user))
        );
        
        showSuccessToast(`${selectedUser.first_name} ${selectedUser.last_name} mis à jour avec succès !`);
        setSelectedUser(null);
        
        // Recharger les données après la mise à jour
        const refreshRes = await fetch("/api/users");
        if (refreshRes.ok) {
          const refreshedData = await refreshRes.json();
          setUsers(refreshedData);
        }
      } else {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  }

  // Ouverture de la modal de confirmation de suppression
  function openDeleteModal(user: User) {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }

  // Suppression d'un utilisateur après confirmation
  async function deleteUserConfirmed() {
    if (!userToDelete) return;

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userToDelete.id }),
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        showSuccessToast(`${userToDelete.first_name} ${userToDelete.last_name} supprimé avec succès !`);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error: any) {
      alert("Erreur: " + error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  }

  // Rendu d'un badge d'état avec la couleur appropriée
  const renderStatusBadge = (status: User['statut_inscription']) => {
    const styles = {
      "inscrit": "bg-green-100 text-green-800",
      "refusé": "bg-red-100 text-red-800",
      "en attente": "bg-yellow-100 text-yellow-800",
    };
    
    return (
      <span className={`px-2 py-1 rounded-sm text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // N'affiche rien si l'utilisateur n'est pas admin
  if (isLoading || !user || role !== "admin") return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row md:overflow-hidden">
      <div className="">
        <SidebarAdmin />
      </div>
      
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 md:px-8 md:py-16 max-w-7xl mx-auto">
          {/* En-tête et actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="display text-3xl md:text-4xl">Adhérents</h1>
          </div>
          
          {/* Barre de recherche et filtres */}
          <div className="mb-6 bg-white rounded-lg p-4 border border-rule">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un adhérent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label="Effacer la recherche"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <button
                className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md sm:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <div className="flex items-center">
                  <FaFilter className="mr-2 text-gray-600" />
                  <span>Filtres</span>
                </div>
                {showFilters ? <FaChevronDown /> : <FaChevronRight />}
              </button>

              {/* Filtres pour écrans plus larges */}
              <div className="hidden sm:flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="inscrit">Inscrits</option>
                  <option value="en attente">En attente</option>
                  <option value="refusé">Refusés</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="tous">Tous les rôles</option>
                  <option value="admin">Administrateurs</option>
                  <option value="animateur">Animateurs</option> {/* Nouvelle option */}
                  <option value="adherent">Adhérents</option>
                </select>
              </div>
            </div>
            
            {/* Filtres pour mobile (accordéon) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4 sm:hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="tous">Tous</option>
                        <option value="inscrit">Inscrits</option>
                        <option value="en attente">En attente</option>
                        <option value="refusé">Refusés</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="tous">Tous</option>
                        <option value="admin">Administrateurs</option>
                        <option value="animateur">Animateurs</option> {/* Nouvelle option */}
                        <option value="adherent">Adhérents</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Statistiques rapides */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-blue-50 p-2 rounded-sm text-center">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-bold text-blue-700">{users.length}</div>
              </div>
              <div className="bg-green-50 p-2 rounded-sm text-center">
                <div className="text-sm text-gray-500">Inscrits</div>
                <div className="font-bold text-green-700">
                  {users.filter(u => u.statut_inscription === "inscrit").length}
                </div>
              </div>
              <div className="bg-yellow-50 p-2 rounded-sm text-center">
                <div className="text-sm text-gray-500">En attente</div>
                <div className="font-bold text-yellow-700">
                  {users.filter(u => u.statut_inscription === "en attente").length}
                </div>
              </div>
              <div className="bg-red-50 p-2 rounded-sm text-center">
                <div className="text-sm text-gray-500">Refusés</div>
                <div className="font-bold text-red-700">
                  {users.filter(u => u.statut_inscription === "refusé").length}
                </div>
              </div>
              {/* Nouvelle statistique pour les animateurs */}
              <div className="bg-blue-50 p-2 rounded-sm text-center">
                <div className="text-sm text-gray-500">Animateurs</div>
                <div className="font-bold text-blue-700">
                  {users.filter(u => u.animateur).length}
                </div>
              </div>
            </div>
          </div>

          {/* Affichage des résultats */}
          <div className="bg-white rounded-lg overflow-hidden border border-rule">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 005.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? "Aucun adhérent ne correspond à votre recherche." : "Aucun adhérent n'est enregistré."}
                </p>
              </div>
            ) : (
              <>
                {/* Vue tableau pour écrans larges */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('last_name')}
                        >
                          <div className="flex items-center">
                            Nom Prénom
                            {sortField === 'last_name' && (
                              sortDirection === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                            )}
                            {sortField !== 'last_name' && <FaSort className="ml-1 text-gray-400" />}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Naissance
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Licence
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.last_name} {user.first_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.birthdate || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.license_number || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.administrateur ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-sm bg-purple-100 text-purple-800">
                                Admin
                              </span>
                            ) : user.animateur ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-sm bg-blue-100 text-blue-800">
                                Animateur
                              </span>
                            ) : (
                              "Adhérent"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStatusBadge(user.statut_inscription)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedUser({...defaultUserValues, ...user})}
                                title="Modifier"
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-sm hover:bg-indigo-50"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteModal(user)}
                                title="Supprimer"
                                className="text-red-600 hover:text-red-900 p-1 rounded-sm hover:bg-red-50"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Vue carte pour mobile */}
                <div className="md:hidden">
                  <ul className="divide-y divide-gray-200">
                    {filteredAndSortedUsers.map((user) => (
                      <li key={user.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {user.last_name} {user.first_name}
                            </h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <span className="text-gray-500">Naissance:</span> {user.birthdate || "N/A"}
                              </div>
                              <div>
                                <span className="text-gray-500">Licence:</span> {user.license_number || "N/A"}
                              </div>
                              <div>
                                <span className="text-gray-500">Rôle:</span> {user.administrateur ? "Admin" : user.animateur ? "Animateur" : "Adhérent"}
                              </div>
                              <div>
                                <span className="text-gray-500">Statut:</span> {renderStatusBadge(user.statut_inscription)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-100"
                              title="Modifier"
                            >
                              <FaEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="p-2 bg-red-50 rounded-md text-red-600 hover:bg-red-100"
                              title="Supprimer"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Modal de confirmation de suppression */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteUserConfirmed}
        title="Confirmer la suppression"
        message={userToDelete ? `Êtes-vous sûr de vouloir supprimer ${userToDelete.first_name} ${userToDelete.last_name} ?` : ""}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
      
      {/* Modal d'édition d'utilisateur */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" aria-hidden="true"></div>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full z-10 border border-rule">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedUser.id ? "Modifier l'adhérent" : "Ajouter un adhérent"}
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={selectedUser.last_name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={selectedUser.first_name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Prénom"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={selectedUser.birthdate}
                  onChange={(e) => setSelectedUser({ ...selectedUser, birthdate: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de licence
                </label>
                <input
                  type="text"
                  value={selectedUser.license_number}
                  onChange={(e) => setSelectedUser({ ...selectedUser, license_number: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Numéro de licence"
                />
              </div>
              
              {/* Sélecteur de statut d'inscription */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut d&apos;inscription
                </label>
                <select
                  value={selectedUser.statut_inscription}
                  onChange={(e) => 
                    setSelectedUser({
                      ...selectedUser,
                      statut_inscription: e.target.value as "en attente" | "inscrit" | "refusé"
                    })
                  }
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en attente">En attente</option>
                  <option value="inscrit">Inscrit</option>
                  <option value="refusé">Refusé</option>
                </select>
              </div>
              
              {/* Case à cocher pour l'administrateur */}
              <div className="flex items-center gap-2">
                <input
                  id="admin-checkbox"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-sm"
                  checked={selectedUser.administrateur}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      administrateur: e.target.checked,
                    })
                  }
                />
                <label htmlFor="admin-checkbox" className="text-sm font-medium text-gray-700">
                  Administrateur
                </label>
              </div>

              {/* Case à cocher pour le rôle animateur */}
              <div className="flex items-center gap-2">
                <input
                  id="animateur-checkbox"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-sm"
                  checked={selectedUser.animateur}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      animateur: e.target.checked,
                    })
                  }
                />
                <label htmlFor="animateur-checkbox" className="text-sm font-medium text-gray-700">
                  Animateur
                </label>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={saveUserEdits}
                className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
              >
                {selectedUser.id ? "Sauvegarder les modifications" : "Ajouter l'adhérent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
