"use client";

import React, { useState, useEffect, useMemo } from "react";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)
import Sidebar from "../components/sidebars/Sidebar";
import Footer from "../components/sidebars/Footer";
import WhiteBackground from "../components/backgrounds/WhiteBackground";
import { FaSearch, FaFilter, FaDownload, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FaRunning, FaHiking, FaWalking, FaBiking, FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import { GiKickScooter } from "react-icons/gi";

// Initialisation du client Supabase

// Mapping des catégories sportives vers leurs IDs
const subCategoryMap: Record<string, number> = {
  Cross: 1,
  Trail: 2,
  Marche: 3,
  VTT: 4,
  Trottinette: 5,
};

// Icônes pour chaque sport
const sportIcons: Record<string, React.ReactNode> = {
  Cross: <FaRunning className="w-5 h-5" />,
  Trail: <FaHiking className="w-5 h-5" />,
  Marche: <FaWalking className="w-5 h-5" />,
  VTT: <FaBiking className="w-5 h-5" />,
  Trottinette: <GiKickScooter className="w-5 h-5" />
};

const ResultsPage: React.FC = () => {
  // États pour gérer les données et filtres
  const [resultatTypes, setResultatTypes] = useState<{ id: number; nom_resultat: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTabComp, setSelectedTabComp] = useState("Cross");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const selectedFilter = selectedTabComp;

  // États pour la vue mobile
  const [mobileView, setMobileView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Récupération des types de résultats au chargement
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("resultatType")
          .select("id, nom_resultat");

        if (error) {
          throw error;
        }

        if (data) {
          setResultatTypes(data);
          if (data.length > 0 && selectedCategory === null) {
            setSelectedCategory(data[0].id);
          }
        }
      } catch (error: any) {
        setErrorMessage("Erreur lors du chargement des catégories: " + error.message);
      }
    };

    fetchCategories();
  }, []);

  // Récupération des résultats quand la catégorie ou le filtre change
  useEffect(() => {
    if (selectedCategory === null) return;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setCurrentPage(1); // Revenir à la première page lors d'un changement de filtre

      try {
        const { data: resultsData, error } = await supabase
          .from("resultats")
          .select(
            `
            *,
            chiens ( prenom ),
            profils ( nom, prenom )
          `
          )
          .eq("id_type", selectedCategory)
          .eq("id_categorie", subCategoryMap[selectedFilter]);

        if (error) {
          throw error;
        }

        setData(resultsData || []);
      } catch (error: any) {
        setErrorMessage("Erreur lors de la récupération des résultats: " + error.message);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedFilter]);

  // Fonction de tri
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Appliquer filtres, tri et pagination
  const filteredAndSortedData = useMemo(() => {
    // Filtrer par terme de recherche
    const filteredData = data.filter(item => {
      const searchFields = [
        item.nomActivite,
        item.lieu,
        item.region,
        item.profils?.nom,
        item.profils?.prenom,
        item.chiens?.prenom
      ];
      
      return searchFields.some(
        field => field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Appliquer le tri
    if (sortConfig) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Gestion spéciale pour les champs imbriqués
        if (sortConfig.key === 'participant') {
          aValue = `${a.profils?.nom || ''} ${a.profils?.prenom || ''}`;
          bValue = `${b.profils?.nom || ''} ${b.profils?.prenom || ''}`;
        } else if (sortConfig.key === 'chien') {
          aValue = a.chiens?.prenom || '';
          bValue = b.chiens?.prenom || '';
        }
        
        // Conversion numérique si possible
        if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  
  // Fonctions de navigation de pages
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Fonction pour exporter en CSV
  const exportToCSV = () => {
    if (filteredAndSortedData.length === 0) return;
    
    // Headers du CSV
    const headers = [
      'Nom activité', 'Lieu', 'Région', 'Distance', 'Participant',
      'Chien', 'Temps', 'Min/km', 'Vitesse', 'Km A/R', 'Classement'
    ];
    
    // Fonction d'échappement pour les valeurs CSV
    const escapeCSVValue = (value: string) => {
      // Si la valeur contient une virgule, des guillemets ou un saut de ligne, 
      // on l'entoure de guillemets et on double les guillemets internes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    // Convertir les données en format CSV
    const csvRows = [
      // En-têtes - on échappe chaque valeur individuellement
      headers.map(header => escapeCSVValue(header)).join(','),
      
      // Lignes de données
      ...filteredAndSortedData.map(item => {
        const rowValues = [
          item.nomActivite || '',
          item.lieu || '',
          item.region || '',
          item.distance || '',
          `${item.profils?.nom || ''} ${item.profils?.prenom || ''}`,
          item.chiens?.prenom || '',
          item.temps || '',
          item.minKm || '',
          item.vitesse || '',
          item.kmAR || '',
          item.classement?.toString() || ''
        ];
        
        // Échapper chaque valeur de la ligne
        return rowValues.map(value => escapeCSVValue(value)).join(',');
      })
    ];
    
    // Ajouter le BOM UTF-8 pour une meilleure compatibilité avec Excel
    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join('\r\n'); // Utilisation de CRLF pour meilleure compatibilité
    
    // Création et téléchargement du fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resultats-${selectedFilter}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Nettoyage
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Rendre le classement avec des icônes pour les 3 premiers
  const renderClassement = (classement: number) => {
    if (classement === 1) {
      return (
        <div className="flex items-center justify-center">
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center">
            <FaTrophy className="text-amber-500 mr-1" /> 1er
          </span>
        </div>
      );
    } else if (classement === 2) {
      return (
        <div className="flex items-center justify-center">
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center">
            <FaMedal className="text-gray-500 mr-1" /> 2e
          </span>
        </div>
      );
    } else if (classement === 3) {
      return (
        <div className="flex items-center justify-center">
          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full flex items-center">
            <FaAward className="text-amber-700 mr-1" /> 3e
          </span>
        </div>
      );
    } else {
      return classement;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Sidebar />
      <WhiteBackground>
        <div className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-blue-900">
              Résultats
            </h1>
            <p className="text-gray-600 mb-6">
              Consultez les performances de nos participants dans différentes disciplines
            </p>
          </motion.div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-8">
            {/* Boutons d'action mobile */}
            <div className="md:hidden border-b border-gray-200">
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-200"
                >
                  <FaFilter /> Filtres {showFilters ? '▲' : '▼'}
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileView(false)}
                    className={`p-2 rounded-sm ${!mobileView ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                    aria-label="Vue tableau"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMobileView(true)}
                    className={`p-2 rounded-sm ${mobileView ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                    aria-label="Vue carte"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Section de filtres (collapsible sur mobile) */}
            <div className={`p-5 border-b border-gray-200 bg-gray-50 ${!showFilters && 'md:block hidden'}`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de résultat
                  </label>
                  <select
                    className="block w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={selectedCategory ?? ""}
                    onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                    disabled={isLoading}
                  >
                    {resultatTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nom_resultat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                  onClick={exportToCSV}
                  disabled={filteredAndSortedData.length === 0 || isLoading}
                >
                  <FaDownload /> Exporter CSV
                </button>
              </div>
            </div>
            
            {/* Onglets pour les différentes disciplines sportives */}
            <div className="overflow-x-auto">
              <div className="flex p-2 gap-2 bg-gray-50 border-b border-gray-200 min-w-max">
                {Object.keys(subCategoryMap).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTabComp(tab)}
                    className={`px-4 py-2 text-center flex items-center justify-center gap-2 transition-all rounded-lg ${
                      selectedTabComp === tab
                        ? "bg-blue-700 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    disabled={isLoading}
                    style={{ minWidth: '110px' }}
                  >
                    {sportIcons[tab]}
                    <span>{tab}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* État de chargement */}
              {isLoading ? (
                <div className="py-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded-sm w-3/4 mx-auto mb-8"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-3/4"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Affichage des résultats */}
                  {currentItems.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm 
                          ? "Aucun résultat ne correspond à votre recherche." 
                          : "Aucun résultat disponible pour cette catégorie."}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-500"
                        >
                          Effacer la recherche
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          Affichage de {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSortedData.length)} sur {filteredAndSortedData.length} résultats
                        </p>
                        <div className="flex items-center gap-2">
                          <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                            Par page:
                          </label>
                          <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded-sm p-1 text-sm"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>

                      {!mobileView ? (
                        // Vue tableau standard (desktop et mobile en mode tableau)
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {[
                                  { key: 'nomActivite', label: 'Nom activité' },
                                  { key: 'lieu', label: 'Lieu' },
                                  { key: 'region', label: 'Région' },
                                  { key: 'distance', label: 'Distance' },
                                  { key: 'participant', label: 'Participant' },
                                  { key: 'chien', label: 'Chien' },
                                  { key: 'temps', label: 'Temps' },
                                  { key: 'minKm', label: 'Min/km' },
                                  { key: 'vitesse', label: 'Vitesse' },
                                  { key: 'kmAR', label: 'Km A/R' },
                                  { key: 'classement', label: 'Classement' }
                                ].map(column => (
                                  <th 
                                    key={column.key} 
                                    className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort(column.key)}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {column.label}
                                      {sortConfig && sortConfig.key === column.key && (
                                        sortConfig.direction === 'asc' 
                                          ? <FaSortAmountUp className="text-blue-500" /> 
                                          : <FaSortAmountDown className="text-blue-500" />
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {currentItems.map((item, index) => (
                                <tr 
                                  key={item.id || index} 
                                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                >
                                  <td className="p-3 text-sm text-gray-700">{item.nomActivite}</td>
                                  <td className="p-3 text-sm text-gray-700">{item.lieu}</td>
                                  <td className="p-3 text-sm text-gray-700">{item.region}</td>
                                  <td className="p-3 text-sm text-gray-700 text-center">{item.distance}</td>
                                  <td className="p-3 text-sm text-gray-700">
                                    {item.profils ? `${item.profils.nom} ${item.profils.prenom}` : ""}
                                  </td>
                                  <td className="p-3 text-sm text-gray-700">
                                    {item.chiens?.prenom}
                                  </td>
                                  <td className="p-3 text-sm text-gray-700 text-center font-medium">{item.temps}</td>
                                  <td className="p-3 text-sm text-gray-700 text-center">{item.minKm}</td>
                                  <td className="p-3 text-sm text-gray-700 text-center">{item.vitesse}</td>
                                  <td className="p-3 text-sm text-gray-700 text-center">{item.kmAR}</td>
                                  <td className="p-3 text-sm text-gray-700 text-center">
                                    {renderClassement(item.classement)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        // Vue carte pour mobile
                        <div className="grid grid-cols-1 gap-4">
                          {currentItems.map((item, index) => (
                            <div 
                              key={item.id || index} 
                              className="bg-white rounded-lg shadow-xs border border-gray-200 p-4"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-blue-900">{item.nomActivite || 'Activité sans nom'}</h3>
                                {item.classement && (
                                  <div className="shrink-0">
                                    {renderClassement(item.classement)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                                <div>
                                  <span className="text-gray-500">Lieu:</span> {item.lieu || '-'}
                                </div>
                                <div>
                                  <span className="text-gray-500">Région:</span> {item.region || '-'}
                                </div>
                                <div>
                                  <span className="text-gray-500">Distance:</span> {item.distance || '-'}
                                </div>
                                <div>
                                  <span className="text-gray-500">Temps:</span> {item.temps || '-'}
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">Participant:</span> {item.profils ? `${item.profils.nom} ${item.profils.prenom}` : '-'}
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">Chien:</span> {item.chiens?.prenom || '-'}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 text-xs border-t border-gray-100 pt-2">
                                <div className="bg-gray-100 px-2 py-1 rounded-full">
                                  <span className="text-gray-500">Min/km:</span> {item.minKm || '-'}
                                </div>
                                <div className="bg-gray-100 px-2 py-1 rounded-full">
                                  <span className="text-gray-500">Vitesse:</span> {item.vitesse || '-'}
                                </div>
                                <div className="bg-gray-100 px-2 py-1 rounded-full">
                                  <span className="text-gray-500">Km A/R:</span> {item.kmAR || '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pagination adaptée au mobile */}
                      {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                          <nav className="inline-flex rounded-md shadow-xs" aria-label="Pagination">
                            <button
                              className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${
                                currentPage === 1 
                                  ? "text-gray-300 cursor-not-allowed border-gray-200 bg-gray-50" 
                                  : "text-blue-600 hover:bg-blue-50 border-gray-300"
                              }`}
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <span className="sr-only">Précédent</span>
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Version mobile simplifiée */}
                            <span className="relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
                              Page {currentPage} sur {totalPages}
                            </span>
                            
                            {/* Version desktop avec numéros de page */}
                            <div className="hidden sm:flex">
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(number => {
                                  if (totalPages <= 5) return true;
                                  return (
                                    number === 1 || 
                                    number === totalPages || 
                                    (number >= currentPage - 1 && number <= currentPage + 1)
                                  );
                                })
                                .map((number, idx, array) => {
                                  const showEllipsisBefore = idx > 0 && array[idx - 1] !== number - 1;
                                  const showEllipsisAfter = idx < array.length - 1 && array[idx + 1] !== number + 1;
                                  
                                  return (
                                    <React.Fragment key={number}>
                                      {showEllipsisBefore && (
                                        <span className="relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
                                          ...
                                        </span>
                                      )}
                                      <button
                                        onClick={() => paginate(number)}
                                        className={`relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 text-sm font-medium ${
                                          currentPage === number
                                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                        }`}
                                      >
                                        {number}
                                      </button>
                                      {showEllipsisAfter && (
                                        <span className="relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
                                          ...
                                        </span>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                            </div>
                            
                            <button
                              className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium ${
                                currentPage === totalPages
                                  ? "text-gray-300 cursor-not-allowed border-gray-200 bg-gray-50"
                                  : "text-blue-600 hover:bg-blue-50 border-gray-300"
                              }`}
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              <span className="sr-only">Suivant</span>
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </WhiteBackground>
      <Footer />
    </div>
  );
};

export default ResultsPage;
