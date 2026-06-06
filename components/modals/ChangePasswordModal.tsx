import React from 'react';
import type { AppUser } from '../../lib/types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  showAlert: (message: string) => void;
}

export default function ChangePasswordModal({ isOpen, onClose, currentUser, showAlert }: ChangePasswordModalProps) {
  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">Alterar Senha</h3>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            const currentPass = d.get('currentPass') as string;
            const newPass = d.get('newPass') as string;

            if (newPass.length < 6) {
              showAlert('A nova senha deve ter no mínimo 6 caracteres.');
              return;
            }

            try {
              const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  currentPassword: currentPass,
                  newPassword: newPass
                })
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha.');

              onClose();
              showAlert('Senha alterada com sucesso!');
            } catch (err: any) {
              console.error('Error updating password:', err);
              showAlert(`Erro ao alterar senha: ${err.message}`);
            }
          }}
          className="space-y-4 font-sans text-[13px]"
        >
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Senha Atual</label>
            <input
              required
              name="currentPass"
              type="password"
              className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Nova Senha</label>
            <input
              required
              name="newPass"
              type="password"
              className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary text-white-pure rounded-xl font-bold shadow-md hover:opacity-90"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
