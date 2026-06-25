'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, InventoryItem, TimelineItem, Cobranca } from '../lib/types';
import { mapInventoryToBackend, mapCobrancaToBackend } from '../lib/mappers';

interface VendaSkincareModuleProps {
  patients: Cliente[];
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setPatients: React.Dispatch<React.SetStateAction<Cliente[]>>;
  selectedPatientId: string | null;
  showAlert: (msg: string) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Cobranca[]>>;
}

export default function VendaSkincareModule({
  patients,
  inventory,
  setInventory,
  setPatients,
  selectedPatientId,
  showAlert,
  setTransactions
}: VendaSkincareModuleProps) {
  const [patientId, setPatientId] = useState<string>(selectedPatientId || '');
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtra apenas produtos que podem ser vendidos (ex: que tem preço de venda)
  const availableProducts = useMemo(() => {
    return inventory.filter(i => i.salePrice && i.salePrice > 0 && i.quantity > 0);
  }, [inventory]);

  const handleAddToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) {
          showAlert(`Estoque insuficiente. Restam apenas ${item.quantity} unidades de ${item.name}.`);
          return prev;
        }
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const handleChangeQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) return handleRemoveFromCart(itemId);
    
    const product = inventory.find(i => i.id === itemId);
    if (!product) return;

    if (qty > product.quantity) {
      showAlert(`Estoque insuficiente. Restam apenas ${product.quantity} unidades.`);
      return;
    }

    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + ((curr.item.salePrice || 0) * curr.quantity), 0);

  const handleCheckout = async () => {
    if (!patientId) {
      showAlert('Selecione um cliente para realizar a venda.');
      return;
    }
    if (cart.length === 0) {
      showAlert('Adicione produtos ao carrinho.');
      return;
    }

    setIsProcessing(true);
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) throw new Error('Cliente não encontrado');

      // 1. Atualizar estoque no DB
      for (const cartItem of cart) {
        const newQuantity = cartItem.item.quantity - cartItem.quantity;
        const { error: invError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', cartItem.item.id);
        if (invError) throw invError;
      }

      // 2. Adicionar cobrança no financeiro
      const cobranca = {
        descricao: `Venda Skincare (${cart.length} itens)`,
        data: new Date().toISOString().split('T')[0],
        categoria: 'Venda de Produto',
        status: 'Pago' as const,
        valor: cartTotal
      };
      
      const { data: cobrancaResult, error: cobrancaError } = await supabase
        .from('cobrancas')
        .insert([mapCobrancaToBackend(cobranca)])
        .select();
      if (cobrancaError) throw cobrancaError;

      // 3. Adicionar evento na linha do tempo do paciente
      const timelineEvent: TimelineItem = {
        id: 'timeline_' + crypto.randomUUID(),
        category: 'Venda de Produto',
        status: 'Concluído',
        title: 'Venda de Skincare',
        date: new Date().toLocaleDateString('pt-BR'),
        description: `Produtos adquiridos: ${cart.map(c => `${c.quantity}x ${c.item.name}`).join(', ')}. Valor total: R$ ${cartTotal.toFixed(2)}.`
      };

      const updatedHistory = [...(patient.historico || []), timelineEvent];
      
      // Update patient total gasto
      const novoGasto = (patient.totalGasto || 0) + cartTotal;

      const { error: patError } = await supabase
        .from('clientes')
        .update({ historico: updatedHistory, total_gasto: novoGasto })
        .eq('id', patient.id);
      if (patError) throw patError;

      // Atualizar estados locais
      setInventory(prev => prev.map(invItem => {
        const cartMatch = cart.find(c => c.item.id === invItem.id);
        if (cartMatch) {
          return { ...invItem, quantity: invItem.quantity - cartMatch.quantity };
        }
        return invItem;
      }));

      setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, historico: updatedHistory, totalGasto: novoGasto } : p));
      
      if (cobrancaResult && cobrancaResult[0]) {
         // Não tem como injetar mapCobrancaToFrontend diretamente aqui facilmente, mas a lista de transações recarrega ao abrir a aba
         // Apenas como placeholder, omitindo update da view local de cobrancas
      }

      showAlert('Venda finalizada com sucesso! Estoque e financeiro atualizados.');
      setCart([]); // Limpar carrinho

    } catch (error: any) {
      console.error('Erro no checkout:', error);
      showAlert(`Erro ao finalizar venda: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-6 md:p-8 relative animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="font-manrope text-headline-lg text-primary font-bold text-[32px] md:text-[40px] leading-tight">Vendas Skincare</h2>
          <p className="font-sans text-[14px] text-on-surface-variant max-w-2xl mt-2">
            Selecione o paciente e os produtos que ele está levando. O estoque será deduzido automaticamente e o financeiro contabilizado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lado Esquerdo: Catálogo e Seleção */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">1. Selecionar Cliente</label>
              <select 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full p-4 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-[14px] font-medium text-on-surface"
              >
                <option value="">-- Busque ou selecione um cliente --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">2. Adicionar Produtos</label>
              
              {availableProducts.length === 0 ? (
                <div className="text-center py-10 text-outline text-[13px] font-medium">
                  Nenhum produto cadastrado com preço de venda ou em estoque.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableProducts.map(item => (
                    <div key={item.id} className="border border-outline-variant/60 rounded-2xl p-4 flex justify-between items-center hover:border-primary/40 transition-colors">
                      <div>
                        <h4 className="font-bold text-[14px] text-on-surface">{item.name}</h4>
                        <p className="text-[12px] text-on-surface-variant mt-1">Estoque: {item.quantity} {item.unit}</p>
                        <p className="font-bold text-primary mt-2">R$ {item.salePrice?.toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="bg-primary/10 text-primary p-2.5 rounded-xl hover:bg-primary hover:text-white-pure transition-colors"
                        title="Adicionar ao Carrinho"
                      >
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>

          {/* Lado Direito: Carrinho de Compras */}
          <div className="lg:col-span-1">
            <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm sticky top-8">
              <h3 className="font-manrope text-[18px] font-bold text-primary flex items-center gap-2 border-b border-outline-variant/50 pb-4 mb-4">
                <span className="material-symbols-outlined">shopping_basket</span>
                Resumo da Venda
              </h3>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-[40px] opacity-30 mb-2">production_quantity_limits</span>
                  <p className="text-[12px]">O carrinho está vazio.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {cart.map(c => (
                      <div key={c.item.id} className="flex justify-between items-start pb-3 border-b border-outline-variant/30 last:border-0">
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-on-surface">{c.item.name}</p>
                          <p className="text-[11px] text-primary font-bold">R$ {c.item.salePrice?.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-surface rounded-lg p-1">
                          <button onClick={() => handleChangeQuantity(c.item.id, c.quantity - 1)} className="p-1 hover:text-error">
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                          </button>
                          <span className="text-[12px] font-bold w-4 text-center">{c.quantity}</span>
                          <button onClick={() => handleChangeQuantity(c.item.id, c.quantity + 1)} className="p-1 hover:text-primary">
                            <span className="material-symbols-outlined text-[14px]">add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-outline-variant/60">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[14px] font-bold text-on-surface-variant uppercase tracking-wider">Total</span>
                      <span className="text-[24px] font-black text-primary">R$ {cartTotal.toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className={`w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md
                        ${isProcessing ? 'bg-primary/50 text-white-pure/80 cursor-not-allowed' : 'bg-primary text-white-pure hover:opacity-95'}`}
                    >
                      {isProcessing ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
                          Processando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          Finalizar Venda
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
