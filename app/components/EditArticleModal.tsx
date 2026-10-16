import { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon, AlertCircle, CheckCircle, Loader, Save, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import supabase from "@/lib/supabaseClient";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  articleId: string;
}

const EditArticleModal: React.FC<ModalProps> = ({ isOpen, onClose, onUpdate, articleId }) => {
  // États du formulaire
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<{ titre: string; contenu: string; image_url: string | null }>({
    titre: "",
    contenu: "",
    image_url: null
  });
  const [replaceImage, setReplaceImage] = useState(false);
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    content?: string;
    image?: string;
  }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Récupérer les données de l'article
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("publication")
          .select("titre, contenu, image_url")
          .eq("id", articleId)
          .single();

        if (error) {
          console.error("❌ Erreur récupération article:", error);
          setNotification({
            type: "error",
            message: "Impossible de récupérer l'article"
          });
          return;
        }

        if (data) {
          setTitle(data.titre);
          setContent(data.contenu);
          setCurrentImageUrl(data.image_url);
          setOriginalData({
            titre: data.titre,
            contenu: data.contenu,
            image_url: data.image_url
          });
        }
      } catch (error) {
        console.error("❌ Exception:", error);
        setNotification({
          type: "error",
          message: "Une erreur est survenue"
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && articleId) {
      fetchArticle();
    }
  }, [isOpen, articleId]);

  // Focus sur le titre à l'ouverture du modal
  useEffect(() => {
    if (isOpen && titleInputRef.current && !loading) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, loading]);

  // Vérifier si des modifications ont été apportées
  useEffect(() => {
    const checkChanges = () => {
      const titleChanged = title !== originalData.titre;
      const contentChanged = content !== originalData.contenu;
      const imageChanged = image !== null || replaceImage;
      
      setHasChanges(titleChanged || contentChanged || imageChanged);
    };
    
    checkChanges();
  }, [title, content, image, replaceImage, originalData]);

  // Écouter le clic à l'extérieur pour fermer le modal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleCloseWithConfirmation();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, hasChanges]);

  // Écouter la touche Echap pour fermer le modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseWithConfirmation();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, hasChanges]);

  if (!isOpen) return null;

  const sanitizeFileName = (filename: string) => {
    return filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    
    if (!file) return;
    
    // Validation du format d'image
    if (!file.type.startsWith("image/")) {
      setFieldErrors(prev => ({
        ...prev,
        image: "Seules les images sont acceptées (JPG, PNG, GIF, etc.)"
      }));
      return;
    }
    
    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        image: "L'image ne doit pas dépasser 5 MB"
      }));
      return;
    }
    
    // Créer l'aperçu de l'image
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setImage(file);
    setReplaceImage(true);
    setFieldErrors(prev => ({ ...prev, image: undefined }));
    
    // Nettoyage de l'URL objet lors du démontage
    return () => URL.revokeObjectURL(objectUrl);
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    if (!title.trim()) {
      errors.title = "Le titre est requis";
    } else if (title.length > 100) {
      errors.title = "Le titre ne doit pas dépasser 100 caractères";
    }
    
    if (!content.trim()) {
      errors.content = "Le contenu est requis";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setNotification({ type: "info", message: "Mise à jour de l'article en cours..." });
    
    try {
      let imageUrl = currentImageUrl;

      // Si on remplace l'image par une nouvelle
      if (replaceImage && image) {
        const cleanName = sanitizeFileName(image.name);
        const uniqueFileName = `${uuidv4()}-${cleanName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(`publications/${uniqueFileName}`, image);

        if (uploadError) {
          console.error("❌ Erreur upload image:", uploadError.message);
          setNotification({
            type: "error",
            message: "Erreur lors de l'upload de l'image. Veuillez réessayer."
          });
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadData?.path 
          ? supabase.storage.from("images").getPublicUrl(uploadData.path).data.publicUrl 
          : "";
      } 
      // Si on supprime l'image sans la remplacer
      else if (replaceImage && !image) {
        imageUrl = null;
      }
      // Sinon on garde l'image actuelle

      // Mise à jour de l'article dans la base de données
      const { error: updateError } = await supabase
        .from("publication")
        .update({
          titre: title,
          contenu: content,
          image_url: imageUrl,
        })
        .eq("id", articleId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setNotification({
        type: "success",
        message: "Article mis à jour avec succès!"
      });
      
      // Mettre à jour les données originales
      setOriginalData({
        titre: title,
        contenu: content,
        image_url: imageUrl
      });
      
      setHasChanges(false);
      
      // Notifier le parent après un délai
      setTimeout(() => {
        onUpdate();
      }, 1000);
      
    } catch (error) {
      console.error("❌ Erreur mise à jour article:", error);
      setNotification({
        type: "error",
        message: "Erreur lors de la mise à jour de l'article. Veuillez réessayer."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWithConfirmation = () => {
    if (hasChanges) {
      const confirmClose = window.confirm("Des modifications n'ont pas été enregistrées. Êtes-vous sûr de vouloir fermer ?");
      if (confirmClose) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleTriggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setReplaceImage(true);
  };
  
  const handleCancelImageChange = () => {
    setImage(null);
    setImagePreview(null);
    setReplaceImage(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* En-tête du modal */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Save size={20} className="mr-2" /> Modifier l&apos;article
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
              onClick={handleCloseWithConfirmation}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Corps du modal */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Titre */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de l&apos;article
                  </label>
                  <input
                    ref={titleInputRef}
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de l'article"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      fieldErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    maxLength={100}
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {fieldErrors.title}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {title.length}/100 caractères
                  </p>
                </div>

                {/* Contenu */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Contenu de l&apos;article
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Contenu de l'article..."
                    rows={8}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      fieldErrors.content ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none`}
                  />
                  {fieldErrors.content && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {fieldErrors.content}
                    </p>
                  )}
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image d&apos;illustration
                  </label>
                  
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  
                  {/* Si on a choisi une nouvelle image */}
                  {imagePreview && (
                    <div className="relative rounded-lg border border-gray-300 overflow-hidden mb-3">
                      <div className="aspect-video w-full relative">
                        <Image
                          src={imagePreview}
                          alt="Nouvelle image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                          Nouvelle image sélectionnée
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          type="button"
                          onClick={handleCancelImageChange}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm flex items-center text-sm"
                        >
                          <X size={14} className="mr-1" /> Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleTriggerImageUpload}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-sm flex items-center text-sm"
                        >
                          <ImageIcon size={14} className="mr-1" /> Changer
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Si on a l'image actuelle et qu'on ne l'a pas remplacée */}
                  {currentImageUrl && !replaceImage && (
                    <div className="relative rounded-lg border border-gray-300 overflow-hidden group">
                      <div className="aspect-video w-full relative">
                        <Image
                          src={currentImageUrl}
                          alt="Image actuelle"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <div className="hidden group-hover:flex gap-2">
                          <button
                            type="button"
                            onClick={handleTriggerImageUpload}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-all flex items-center"
                          >
                            <ImageIcon size={16} className="mr-1" /> Changer
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-all flex items-center"
                          >
                            <Trash2 size={16} className="mr-1" /> Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Si on a supprimé l'image ou qu'on n'en a pas */}
                  {(!currentImageUrl || (replaceImage && !imagePreview)) && (
                    <div 
                      onClick={handleTriggerImageUpload}
                      className={`border-2 border-dashed ${
                        fieldErrors.image ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-500'
                      } rounded-lg p-8 text-center cursor-pointer transition-colors`}
                    >
                      <div className="flex flex-col items-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                          Cliquez pour {currentImageUrl ? 'remplacer' : 'ajouter'} une image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF jusqu&apos;à 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {fieldErrors.image && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {fieldErrors.image}
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Pied du modal */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCloseWithConfirmation}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Annuler
            </button>

            <div className="flex items-center space-x-2">
              {notification && (
                <span 
                  className={`text-sm flex items-center ${
                    notification.type === 'error' ? 'text-red-600' : 
                    notification.type === 'success' ? 'text-green-600' : 
                    'text-blue-600'
                  }`}
                >
                  {notification.type === 'error' && <AlertCircle size={16} className="mr-1" />}
                  {notification.type === 'success' && <CheckCircle size={16} className="mr-1" />}
                  {notification.type === 'info' && <Loader size={16} className="mr-1 animate-spin" />}
                  {notification.message}
                </span>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !hasChanges}
                className={`px-5 py-2 rounded-md text-white font-medium flex items-center ${
                  isSubmitting || !hasChanges
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } transition-colors`}
              >
                {isSubmitting && <Loader size={16} className="mr-2 animate-spin" />}
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditArticleModal;