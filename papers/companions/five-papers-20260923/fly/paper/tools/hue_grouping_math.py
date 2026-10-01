"""Local mathematical reconstruction of the reviewed PLS/grouping procedure.

Reference: chreyesees/pls.py, pinned intake 38, adapted there from scikit-learn
by Edouard Duchesnay (header: BSD 3 clause). No original package is imported.
This local implementation uses NumPy SVD/pinv, not the original SciPy runtime.
"""
import numpy as np


def excitation_coordinate(q):
    q = np.asarray(q, dtype=float)
    if not np.all(np.isfinite(q)) or np.any(q < 0):
        raise ValueError('Captures must be finite and nonnegative')
    return 2 * (q / (q + 1) - 0.5)


def power_vectors(X, Y):
    eps = np.finfo(float).eps
    candidates = np.flatnonzero(np.any(np.abs(Y) > eps, axis=0))
    if not len(candidates):
        raise ValueError('Y residual is constant')
    score = Y[:, candidates[0]].copy()
    previous = 100
    for iteration in range(500):
        if not np.dot(score, score) > 0:
            raise ValueError('Degenerate Y score')
        wx = X.T @ score / (score @ score)
        wx /= np.sqrt(wx @ wx) + eps
        tx = X @ wx
        if not tx @ tx > 0:
            raise ValueError('Degenerate X score')
        wy = Y.T @ tx / (tx @ tx)
        score = Y @ wy / (wy @ wy + eps)
        difference = wx - previous
        if difference @ difference < 1e-6 or Y.shape[1] == 1:
            return wx, wy, iteration + 1
        previous = wx
    raise ValueError('NIPALS did not converge in 500 iterations')


def pls_factors(X, Y):
    X = np.asarray(X, dtype=float).copy()
    Y = np.asarray(Y, dtype=float).copy()
    if X.ndim != 2 or Y.ndim != 2 or X.shape[0] != Y.shape[0]:
        raise ValueError('Invalid matrix dimensions')
    if not np.all(np.isfinite(X)) or not np.all(np.isfinite(Y)):
        raise ValueError('PLS inputs must be finite')
    if X.shape[1] < 2 or X.shape[0] < 2:
        raise ValueError('Two components require sufficient X dimensions')
    weights, xloads, yloads, iterations = [], [], [], []
    for _ in range(2):
        Y[:, np.all(np.abs(Y) < 10 * np.finfo(float).eps, axis=0)] = 0.0
        wx, wy, n = power_vectors(X, Y)
        sign = np.sign(wx[np.argmax(np.abs(wx))])
        wx, wy = wx * sign, wy * sign
        score = X @ wx
        denominator = score @ score
        lx, ly = score @ X / denominator, score @ Y / denominator
        X -= np.outer(score, lx)
        Y -= np.outer(score, ly)
        weights.append(wx)
        xloads.append(lx)
        yloads.append(ly)
        iterations.append(n)
    W, P, Q = np.stack(weights, axis=1), np.stack(xloads, axis=1), np.stack(yloads, axis=1)
    small = P.T @ W
    singular = np.linalg.svd(small, compute_uv=False)
    if singular[-1] <= singular[0] * 2 * np.finfo(float).eps:
        raise ValueError('Rank-deficient rotation matrix')
    rotation = W @ np.linalg.pinv(small, rcond=2 * np.finfo(float).eps)
    basis, scale, orientation = np.linalg.svd(rotation, full_matrices=False)
    factors = (np.diag(scale) @ orientation @ Q.T).T
    return factors, {'iterations': iterations, 'small_matrix_singular_values': singular.tolist(),
                     'rotation_singular_values': scale.tolist(),
                     'factorization_max_error': float(np.max(np.abs(rotation @ Q.T - basis @ factors.T)))}, {
                         'weights': W, 'x_loadings': P, 'y_loadings': Q,
                         'rotation': rotation, 'orthogonal_basis': basis}


def group_angles(factors):
    factors = np.asarray(factors, dtype=float)
    if factors.ndim != 2 or factors.shape[1] != 2 or not len(factors) or not np.all(np.isfinite(factors)):
        raise ValueError('Expected finite nonempty two-dimensional factors')
    angles = np.mod(np.arctan2(factors[:, 1], factors[:, 0]), 2*np.pi)
    histogram, edges = np.histogram(angles, bins=24, range=(0, 2*np.pi))
    modal_index = int(np.argmax(histogram))
    modal_center = (edges[modal_index] + edges[modal_index+1]) / 2
    centers = np.arange(modal_center, modal_center+2*np.pi-np.pi/4, np.pi/2) % (2*np.pi)
    membership, pairs = [], []
    for center in centers:
        lo, hi = (center-np.pi/4) % (2*np.pi), (center+np.pi/4) % (2*np.pi)
        in_bin = (angles >= lo) & (angles < hi) if lo < hi else (angles >= lo) | (angles < hi)
        membership.append(in_bin)
        pairs.append([float(lo), float(hi)])
    membership = np.stack(membership)
    if not np.all(membership.sum(axis=0) == 1):
        raise ValueError('Grouping bins do not form a unique partition')
    labels = np.arange(4) @ membership.astype(int)
    proportions = membership.mean(axis=1)
    return labels, angles, {'modal_histogram_index': modal_index,
                            'modal_ties': np.flatnonzero(histogram == histogram.max()).tolist(),
                            'histogram': histogram.tolist(), 'modal_center': float(modal_center),
                            'edge_pairs': pairs, 'proportions': proportions.tolist(),
                            'group_column_counts': membership.sum(axis=1).tolist(),
                            'zero_length_factors': int(np.sum(np.all(factors == 0, axis=1)))}


def group_observations(Y, labels):
    if Y.ndim != 2 or labels.shape != (Y.shape[1],) or not np.all(np.isin(labels, [0,1,2,3])):
        raise ValueError('Invalid group-observation interface')
    finite = np.isfinite(Y)
    counts = np.zeros((Y.shape[0], 4), dtype=int)
    means = np.full((Y.shape[0], 4), np.nan)
    for label in range(4):
        selected = labels == label
        counts[:, label] = finite[:, selected].sum(axis=1)
        numerator = np.where(finite[:, selected], Y[:, selected], 0).sum(axis=1)
        np.divide(numerator, counts[:, label], out=means[:, label], where=counts[:, label] > 0)
    return means, counts
