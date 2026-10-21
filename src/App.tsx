import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar, AppTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProductManagementView } from './components/ProductManagementView';
import { VouchersView } from './components/VouchersView';
import { WarehouseMapView } from './components/WarehouseMapView';
import { ReportsView } from './components/ReportsView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodePrintModal } from './components/BarcodePrintModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { ProductFormModal } from './components/ProductFormModal';
import { Product } from './types/inventory';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { language, t, addProduct, updateProduct } = useInventory();

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300 ${
        language === 'ar' ? 'font-sans' : 'font-sans'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProductModal={handleOpenAddProduct}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenProductModal={handleOpenAddProduct}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagementView
            onOpenAddModal={handleOpenAddProduct}
            onEditProduct={handleEditProduct}
          />
        )}

        {activeTab === 'vouchers' && <VouchersView />}

        {activeTab === 'map' && <WarehouseMapView />}

        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{t.appName} · {t.appSubtitle}</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{language === 'ar' ? 'تحديث فوري للأرصدة' : 'Mise à jour en temps réel'}</span>
            <span>·</span>
            <span>{language === 'ar' ? 'محاكاة 3D تفاعلية' : 'Simulation 3D interactive'}</span>
            <span>·</span>
            <span>{language === 'ar' ? 'طباعة الباركود والوصولات' : 'Impression codes-barres & bons'}</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Overlays */}
      <BarcodeScannerModal />
      <BarcodePrintModal />
      <AlertsDrawer />
      
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainAppContent />
    </InventoryProvider>
  );
}
