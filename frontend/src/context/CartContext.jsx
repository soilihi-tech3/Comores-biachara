import React, { createContext, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, X, Info } from "lucide-react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // [{ product, quantite }]
  const [toast, setToast] = useState(null); // { message, type }

  function showToast(message, type = "warning") {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }

  function addToCart(product, quantite = 1) {
    if (!product) return false;

    const stockMax = Number(product.stock ?? 0);
    const itemExistant = cart.find((l) => l.product.id === product.id);
    const dejaEnPanier = itemExistant ? itemExistant.quantite : 0;

    // Case 1: Product out of stock completely
    if (stockMax <= 0) {
      showToast(
        `Desolé, le produit "${product.nom}" est actuellement en rupture de stock.`,
        "error"
      );
      return false;
    }

    // Case 2: Cart already has total available stock
    if (dejaEnPanier >= stockMax) {
      showToast(
        `Stock épuisé pour "${product.nom}" ! Il reste ${stockMax} article(s) en stock et vous l'avez déjà dans votre panier. Impossible d'en ajouter plus.`,
        "warning"
      );
      return false;
    }

    const nouvelleQuantite = dejaEnPanier + quantite;

    // Case 3: Requested quantity exceeds stock limit
    if (nouvelleQuantite > stockMax) {
      const qteAjoutee = stockMax - dejaEnPanier;
      setCart((prev) =>
        prev.map((l) =>
          l.product.id === product.id ? { ...l, quantite: stockMax } : l
        )
      );
      showToast(
        `Quantité ajustée au stock disponible (${stockMax} restants). ${qteAjoutee} article(s) supplémentaire(s) ajouté(s) à votre panier.`,
        "warning"
      );
      return true;
    }

    // Case 4: Normal addition
    setCart((prev) => {
      if (itemExistant) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantite: nouvelleQuantite }
            : l
        );
      }
      return [...prev, { product, quantite }];
    });

    if (stockMax === nouvelleQuantite) {
      showToast(
        `"${product.nom}" ajouté ! Vous avez atteint la totalité du stock disponible (${stockMax}).`,
        "info"
      );
    } else {
      showToast(`"${product.nom}" ajouté au panier !`, "success");
    }

    return true;
  }

  function updateQuantite(productId, delta) {
    setCart((prev) => {
      const item = prev.find((l) => l.product.id === productId);
      if (!item) return prev;

      const stockMax = Number(item.product.stock ?? 0);
      const nouvelleQte = item.quantite + delta;

      if (delta > 0 && nouvelleQte > stockMax) {
        showToast(
          `Stock limité ! Impossible d'ajouter plus de ${stockMax} article(s) pour "${item.product.nom}".`,
          "warning"
        );
        return prev;
      }

      return prev
        .map((l) =>
          l.product.id === productId ? { ...l, quantite: nouvelleQte } : l
        )
        .filter((l) => l.quantite > 0);
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = cart.reduce(
    (s, l) => s + Number(l.product.prixPromo || l.product.prix) * l.quantite,
    0
  );
  const count = cart.reduce((s, l) => s + l.quantite, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantite,
        removeFromCart,
        clearCart,
        subtotal,
        count,
        showToast,
      }}
    >
      {children}

      {/* FLOATING TOAST NOTIFICATION (BOTTOM SLEEK PILL) */}
      {toast && (
        <div className={`bs-toast-banner ${toast.type}`}>
          <div className="bs-toast-icon">
            {toast.type === "success" && <CheckCircle2 size={19} color="#10B981" />}
            {toast.type === "warning" && <AlertTriangle size={19} color="#F59E0B" />}
            {toast.type === "error" && <AlertTriangle size={19} color="#EF4444" />}
            {toast.type === "info" && <Info size={19} color="#3B82F6" />}
          </div>
          <div className="bs-toast-body">
            <div className="bs-toast-msg">{toast.message}</div>
          </div>
          <button className="bs-toast-close-btn" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
