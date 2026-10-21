import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Box,
  Building2,
  Barcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { WAREHOUSE_ZONES } from '../utils/mockData';
import { Warehouse3DScene } from './Warehouse3DScene';

export const WarehouseMapView: React.FC = () => {
  const { language, t, products, setSelectedProductForBarcode, setScannedProduct, setIsScannerOpen } = useInventory();

  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('A');
  const [highlightQuery, setHighlightQuery] = useState<string>('');

  const activeZone = WAREHOUSE_ZONES.find((z) => z.id === selectedZoneId) || WAREHOUSE_ZONES[0];
  const zoneProducts = products.filter((p) => p.location.zone.includes(`Zone ${selectedZoneId}`) || p.location.zone.includes(`المنطقة ${selectedZoneId}`));

  const highlightedProducts = highlightQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(highlightQuery.toLowerCase()) ||
          p.barcode.includes(highlightQuery) ||
          p.sku.toLowerCase().includes(highlightQuery.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>{t.navMap}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
              3D Live
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar'
              ? 'مخطط ثلاثي وثنائي الأبعاد لمناطق التخزين وتتبع حركة العمال بين الأرفف بالزمن الحقيقي'
              : 'Vue 3D et 2D interactive des rayonnages avec suivi en temps réel des préparateurs et allées'}
          </p>
        </div>

        {/* View Mode Switcher: 3D Scene vs 2D Plan */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-sm">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              viewMode === '3D'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{language === 'ar' ? 'الخريطة التفاعلية 3D' : 'Simulation 3D'}</span>
          </button>

          <button
            onClick={() => setViewMode('2D')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              viewMode === '2D'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{language === 'ar' ? 'مخطط الأرفف 2D' : 'Plan 2D Rayons'}</span>
          </button>
        </div>
      </div>

      {/* 3D Scene View Mode */}
      {viewMode === '3D' && (
        <div className="space-y-4 animate-fadeIn">
          <Warehouse3DScene />
        </div>
      )}

      {/* 2D Plan View Mode */}
      {viewMode === '2D' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Zone Selector Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WAREHOUSE_ZONES.map((zone) => {
              const count = products.filter((p) => p.location.zone.includes(zone.id)).length;
              const isSelected = selectedZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-4 rounded-xl text-right rtl:text-right ltr:text-left border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/20 shadow-lg'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-slate-300'}`}>
                      Zone {zone.id}
                    </span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {count} {language === 'ar' ? 'صنف' : 'articles'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{zone.title}</p>
                </button>
              );
            })}
          </div>

          {/* 2D Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual 2D Rack Plan (8 cols) */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">
                    Zone {activeZone.id}: {activeZone.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> {language === 'ar' ? 'رف مشغول' : 'Occupé'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-800 inline-block border border-slate-700" /> {language === 'ar' ? 'رف متاح' : 'Disponible'}
                  </span>
                </div>
              </div>

              {/* Aisles Graphic Grid */}
              <div className="space-y-6">
                {['01', '02', '03', '04'].map((aisleNum) => {
                  const aisleProducts = zoneProducts.filter((p) => p.location.aisle === aisleNum);
                  return (
                    <div key={aisleNum} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                          <span>{t.aisle} Aisle {aisleNum}</span>
                          <span className="text-slate-500 font-normal">({aisleProducts.length} {language === 'ar' ? 'سلع مخزنة' : 'articles'})</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {language === 'ar' ? 'ممر رافعات الشوك 3.2 م' : 'Voie chariot élévateur 3.2m'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((shelfIdx) => {
                          const shelfCode = `${activeZone.id}-${shelfIdx}`;
                          const shelfItems = aisleProducts.filter(
                            (p) => p.location.shelf === shelfCode || p.location.shelf.includes(`${shelfIdx}`)
                          );
                          const isOccupied = shelfItems.length > 0;
                          const hasLowStock = shelfItems.some((p) => p.quantity <= p.minQuantity);

                          return (
                            <div
                              key={shelfIdx}
                              className={`p-3 rounded-lg border text-right rtl:text-right ltr:text-left transition-all relative ${
                                isOccupied
                                  ? hasLowStock
                                    ? 'bg-amber-950/20 border-amber-500/40'
                                    : 'bg-slate-900 border-slate-700/80'
                                  : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-mono font-bold">
                                <span className={isOccupied ? 'text-white' : 'text-slate-600'}>
                                  {t.shelfRack} {shelfCode}
                                </span>
                                {isOccupied && (
                                  <span className="text-[10px] text-amber-400 tabular-nums">
                                    {shelfItems.length} {language === 'ar' ? 'صنف' : 'réf'}
                                  </span>
                                )}
                              </div>

                              {isOccupied ? (
                                <div className="mt-2 space-y-1">
                                  {shelfItems.map((item) => (
                                    <div
                                      key={item.id}
                                      onClick={() => {
                                        setScannedProduct(item);
                                        setIsScannerOpen(true);
                                      }}
                                      className="text-[11px] text-slate-300 hover:text-amber-400 font-medium truncate cursor-pointer"
                                      title={item.name}
                                    >
                                      • {item.name} ({item.quantity} {item.unit})
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="mt-2 block text-[10px] text-slate-600">
                                  {language === 'ar' ? 'رف فارغ متاح' : 'Emplacement libre'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Sidebar: Items in Zone (4 cols) */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Zone {activeZone.id}</h3>
                <span className="font-mono text-xs text-amber-400 font-bold tabular-nums">
                  {zoneProducts.length} {language === 'ar' ? 'سلع' : 'articles'}
                </span>
              </div>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {zoneProducts.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    {language === 'ar' ? 'لا توجد سلع مخزنة حالياً في هذه المنطقة' : 'Aucun article dans cette zone'}
                  </div>
                ) : (
                  zoneProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white line-clamp-1">{prod.name}</span>
                        <span className="font-mono font-bold text-emerald-400 shrink-0 tabular-nums">
                          {prod.quantity} {prod.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{t.aisle}: {prod.location.aisle} · {t.shelfRack}: {prod.location.shelf}</span>
                        <span>SKU: {prod.sku}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setScannedProduct(prod);
                            setIsScannerOpen(true);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-medium text-[11px] flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{language === 'ar' ? 'تحديد الموقع' : 'Localiser'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedProductForBarcode(prod)}
                          className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                        >
                          <Barcode className="w-3 h-3" />
                          <span>{t.printSticker}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
