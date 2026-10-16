"use client";

import { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaChevronRight, FaChevronDown, FaPlus } from "react-icons/fa";
import supabase from "@/lib/supabaseClient"; // Client Supabase
import ModalAdd from "./AddResultatModal";
import ModalEdit from "./ModalEditResultat";
import ModalConfirm from "./ModalConfirm";

export default function TableResultats({ isModalOpen, setIsModalOpen }) {
  const [resultats, setResultats] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResultat, setSelectedResultat] = useState(null);
  const [selectedResultatId, setSelectedResultatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  // Pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchResultats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from("resultats")
          .select(`
            *,
            chiens ( prenom ),
            profils ( nom, prenom ),
            categorieResultat ( nom_categorie ),
            resultatType ( nom_resultat )
          `);

        if (error) throw error;

        if (data) {
          const formatedData = data.map((item) => {
            const profilNomComplet = item.profils
              ? `${item.profils.nom} ${item.profils.prenom}`
              : "";

            return {
              ...item,
              created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "",
              date: item.date ? new Date(item.date).toLocaleDateString() : "",
              chienPrenom: item.chiens?.prenom || "",
              profilNomComplet,
              categorieNom: item.categorieResultat?.nom_categorie || "",
              typeNom: item.resultatType?.nom_resultat || "",
            };
          });

          setResultats(formatedData);
        }
      } catch (err) {
        console.error("❌ Erreur de récupération :", err);
        setError("Impossible de charger les résultats. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResultats();
  }, [supabase]);

  const handleDeleteClick = (id, event) => {
    event.stopPropagation();
    setSelectedResultatId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedResultatId) return;
    
    try {
      const { error } = await supabase
        .from("resultats")
        .delete()
        .match({ id: selectedResultatId });

      if (error) throw error;
      
      setResultats((prev) => prev.filter((res) => res.id !== selectedResultatId));
      
      // Notification de succès (à implémenter)
    } catch (err) {
      console.error("❌ Erreur de suppression :", err);
      // Notification d'erreur (à implémenter)
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedResultatId(null);
    }
  };

  const handleEditClick = (resultat, event) => {
    event.stopPropagation();
    setSelectedResultat(resultat);
    setIsEditModalOpen(true);
  };
  
  const toggleRowExpansion = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Calculer les éléments de la page courante
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = resultats.slice(indexOfFirstItem, indexOfLastItem);

  // Changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Si chargement en cours
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg w-full flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg w-full flex flex-col items-center min-h-[300px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <p className="mt-3 text-gray-800 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si aucun résultat
  if (resultats.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg w-full flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <FaPlus className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Aucun résultat disponible</h3>
          <p className="mt-2 text-sm text-gray-500">
            Commencez par ajouter un premier résultat à votre catalogue.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <FaPlus className="mr-2" /> 
            Ajouter un résultat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg w-full overflow-hidden border border-rule">
      {/* Vue desktop - tableau standard */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm text-gray-700 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Participant / Chien</th>
              <th className="p-3 text-left">Catégorie</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-center">Temps</th>
              <th className="p-3 text-center">Vitesse</th>
              <th className="p-3 text-center">Distance</th>
              <th className="p-3 text-center">Classement</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((res) => (
              <tr key={res.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="p-3">{res.date}</td>
                <td className="p-3">
                  <div className="font-medium">{res.profilNomComplet}</div>
                  <div className="text-xs text-gray-500">Chien: {res.chienPrenom}</div>
                </td>
                <td className="p-3">{res.categorieNom}</td>
                <td className="p-3">{res.typeNom}</td>
                <td className="p-3 text-center font-medium">{res.temps}</td>
                <td className="p-3 text-center">{res.vitesse} km/h</td>
                <td className="p-3 text-center">{res.distance} km</td>
                <td className="p-3 text-center">
                  {res.classement ? (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-sm">
                      {res.classement}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => handleEditClick(res, e)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
                      aria-label="Modifier"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(res.id, e)}
                      className="p-1.5 bg-gray-100 hover:bg-red-100 rounded-full text-gray-600 hover:text-red-600"
                      aria-label="Supprimer"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue mobile - cartes */}
      <div className="lg:hidden">
        <ul className="divide-y divide-gray-200">
          {currentItems.map((res) => (
            <li 
              key={res.id} 
              className="py-3 px-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleRowExpansion(res.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    {res.profilNomComplet} avec {res.chienPrenom}
                  </p>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="mr-2">{res.date}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-sm">
                      {res.categorieNom}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4 text-sm text-right">
                    <div className="font-medium">{res.temps}</div>
                    <div className="text-xs text-gray-500">
                      {res.classement && `#${res.classement}`}
                    </div>
                  </div>
                  <button className="text-gray-500">
                    {expandedRowId === res.id ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Détails étendus */}
              {expandedRowId === res.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Type:</span> {res.typeNom}
                    </div>
                    <div>
                      <span className="text-gray-500">Distance:</span> {res.distance} km
                    </div>
                    <div>
                      <span className="text-gray-500">Vitesse:</span> {res.vitesse} km/h
                    </div>
                    <div>
                      <span className="text-gray-500">Lieu:</span> {res.lieu}
                    </div>
                    <div>
                      <span className="text-gray-500">Région:</span> {res.region}
                    </div>
                    <div>
                      <span className="text-gray-500">Activité:</span> {res.nomActivite}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={(e) => handleEditClick(res, e)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 flex items-center text-xs"
                    >
                      <FaEdit size={12} className="mr-1" /> Modifier
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(res.id, e)}
                      className="p-1.5 bg-gray-100 hover:bg-red-100 rounded-md text-gray-600 hover:text-red-600 flex items-center text-xs"
                    >
                      <FaTrash size={12} className="mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {resultats.length > itemsPerPage && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, resultats.length)}
              </span>{" "}
              sur <span className="font-medium">{resultats.length}</span> résultats
            </p>
          </div>
          <div className="flex justify-center sm:justify-end flex-1">
            <nav className="inline-flex rounded-md -space-x-px">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${ currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-500 hover:bg-gray-50" } text-sm font-medium border-gray-300`}
              >
                <span className="sr-only">Précédent</span>
                &larr;
              </button>
              
              {/* Affichage des numéros de page (simplifié) */}
              {Array.from({ length: Math.ceil(resultats.length / itemsPerPage) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border ${ currentPage === index + 1 ? "bg-blue-50 border-blue-500 z-10 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" } text-sm font-medium`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(resultats.length / itemsPerPage)}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${ currentPage === Math.ceil(resultats.length / itemsPerPage) ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-500 hover:bg-gray-50" } text-sm font-medium border-gray-300`}
              >
                <span className="sr-only">Suivant</span>
                &rarr;
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        title="Voulez-vous vraiment supprimer ce résultat ?"
        message="Cette action est irréversible et supprimera définitivement les données associées à ce résultat."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <ModalAdd
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={(newRes) => {
          const formatted = {
            ...newRes,
            date: newRes.date ? new Date(newRes.date).toLocaleDateString() : "",
            created_at: newRes.created_at ? new Date(newRes.created_at).toLocaleString() : "",
            chienPrenom: newRes.chiens?.prenom || "",
            profilNomComplet: newRes.profils ? `${newRes.profils.nom} ${newRes.profils.prenom}` : "",
            categorieNom: newRes.categorieResultat?.nom_categorie || "",
            typeNom: newRes.resultatType?.nom_resultat || "",
          };
          setResultats((prev) => [...prev, formatted]);
        }}
      />

      <ModalEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={selectedResultat}
      />
    </div>
  );
}
