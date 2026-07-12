const svc = require('./expenses.service');
exports.list = async (req, res, next) => { try { const d = await svc.list(req.query); res.json({ success: true, data: d, count: d.length }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch (e) { next(e); } };
exports.update = async (req, res, next) => { try { res.json({ success: true, data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { await svc.delete(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
exports.stats = async (req, res, next) => { try { res.json({ success: true, data: await svc.getStats() }); } catch (e) { next(e); } };
