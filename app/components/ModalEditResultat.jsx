"use client";

import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)
import { FaTimes, FaMapMarkerAlt, FaRunning, FaTrophy, FaClock, FaRuler, FaTachometerAlt, FaFlag } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";


const ModalEditResultat = ({ isOpen, onClose, data, onUpdate }) => {
  const [formData, setFormData] = useState({
    temps: "",
    vitesse: "",
    distance: "",
    region: "",
    lieu: "",
    nomActivite: "",
    classement: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  
  const modalRef = useRef(null);
  const initialFocusRef = useRef(null);

  // Initialiser les données du formulaire lorsque la prop data change
  useEffect(() => {
    if (data) {
      setFormData({
        temps: data.temps || "",
        vitesse: data.vitesse || "",
        distance: data.distance || "",
        region: data.region || "",
        lieu: data.lieu || "",
        nomActivite: data.nomActivite || "",
        classement: data.classement || ""
      });
    }
  }, [data]);

  // Focus initial et gestion de la touche Échap
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => initialFocusRef.current?.focus(), 100);
      
      const handleEscape = (e) => {
        if (e.key === "Escape") onClose();
      };
      
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Gestion du clic extérieur pour fermer le modal
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Mise à jour des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur si l'utilisateur commence à modifier le champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nomActivite.trim()) {
      newErrors.nomActivite = "Le nom de l'activité est requis";
    }
    
    if (!formData.lieu.trim()) {
      newErrors.lieu = "Le lieu est requis";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("resultats")
        .update({
          temps: formData.temps,
          vitesse: formData.vitesse,
          distance: formData.distance,
          region: formData.region,
          lieu: formData.lieu,
          nomActivite: formData.nomActivite,
          classement: formData.classement,
        })
        .match({ id: data.id });

      if (error) throw error;
      
      setNotification({
        type: "success",
        message: "Résultat mis à jour avec succès!"
      });
      
      // Informer le parent de la mise à jour sans recharger la page
      if (onUpdate) onUpdate(formData);
      
      // Fermer après un délai pour que l'utilisateur voit la notification
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("❌ Erreur de mise à jour :", error);
      setNotification({
        type: "error",
        message: "Erreur lors de la mise à jour du résultat"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Structure de l'interface
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" 
          onClick={handleOutsideClick}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50"
          />
          
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-lg relative z-10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">Modifier un Résultat</h2>
              <p className="text-blue-100 text-sm mt-1">
                {data?.nomActivite || "Détails de l'activité"}
              </p>
            </div>

            {/* Corps du formulaire */}
            <div className="p-6">
              {/* Notification */}
              <AnimatePresence>
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-4 p-3 rounded-md text-sm ${
                      notification.type === "success" 
                        ? "bg-green-50 text-green-800 border border-green-200" 
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {notification.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Informations principales */}
              <div className="space-y-5">
                {/* Nom de l'activité */}
                <div>
                  <label htmlFor="nomActivite" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'activité *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFlag className="text-gray-400" />
                    </div>
                    <input
                      ref={initialFocusRef}
                      type="text"
                      id="nomActivite"
                      name="nomActivite"
                      placeholder="Exemple: Course des Héros"
                      value={formData.nomActivite}
                      onChange={handleChange}
                      className={`pl-10 w-full p-2.5 border rounded-lg ${
                        errors.nomActivite ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.nomActivite && (
                    <p className="mt-1 text-sm text-red-600">{errors.nomActivite}</p>
                  )}
                </div>
                
                {/* Localisation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lieu" className="block text-sm font-medium text-gray-700 mb-1">
                      Lieu *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="lieu"
                        name="lieu"
                        placeholder="Ville/lieu"
                        value={formData.lieu}
                        onChange={handleChange}
                        className={`pl-10 w-full p-2.5 border rounded-lg ${
                          errors.lieu ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.lieu && (
                      <p className="mt-1 text-sm text-red-600">{errors.lieu}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                      Région
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="region"
                        name="region"
                        placeholder="Département/région"
                        value={formData.region}
                        onChange={handleChange}
                        className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Détails sportifs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="temps" className="block text-sm font-medium text-gray-700 mb-1">
                      Temps
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaClock className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="temps"
                        name="temps"
                        placeholder="00:00:00"
                        value={formData.temps}
                        onChange={handleChange}
                        className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
                      Distance
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaRuler className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="distance"
                        name="distance"
                        placeholder="0.0 km"
                        value={formData.distance}
                        onChange={handleChange}
                        className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="vitesse" className="block text-sm font-medium text-gray-700 mb-1">
                      Vitesse
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaTachometerAlt className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="vitesse"
                        name="vitesse"
                        placeholder="0.0 km/h"
                        value={formData.vitesse}
                        onChange={handleChange}
                        className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Classement */}
                <div>
                  <label htmlFor="classement" className="block text-sm font-medium text-gray-700 mb-1">
                    Classement
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTrophy className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="classement"
                      name="classement"
                      placeholder="Position ou rang"
                      value={formData.classement}
                      onChange={handleChange}
                      className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pied du modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalEditResultat;
