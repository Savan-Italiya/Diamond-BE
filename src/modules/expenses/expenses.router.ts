import { Router } from 'express';
import { ExpensesController } from './expenses.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/',          ExpensesController.list);
router.get('/summary',   ExpensesController.summary);
router.post('/',         ExpensesController.create);
router.delete('/:id',    ExpensesController.remove);

export default router;
