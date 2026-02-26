import { Despesa } from '../types';

type Role = 'master' | 'contador';

export const RBAC_RULES = {
  contadorCanEditOnlyOwn: true,
  contadorCanDeleteOnlyOwn: false,
};

export const canEditExpense = (role: Role | undefined, userId: string | undefined, despesa: Despesa) => {
  if (!role || !userId) return false;
  if (role === 'master') return true;
  if (!RBAC_RULES.contadorCanEditOnlyOwn) return true;
  return (despesa.responsavel_id || despesa.user_id) === userId;
};
