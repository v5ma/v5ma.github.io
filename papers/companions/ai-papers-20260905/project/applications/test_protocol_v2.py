import json
from pathlib import Path
import unittest
import numpy as np
from causal_lab import worlds, Network
from run_development_v2 import partition, batch

ROOT=Path(__file__).resolve().parent.parent


class DonorClosureTests(unittest.TestCase):
    def setUp(self):
        self.config=json.loads((ROOT/"applications"/"PROTOCOL-DEV-02.json").read_text(encoding="utf-8"))
        self.split,self.families=partition(self.config)

    def test_disjoint_complete_worlds(self):
        flat=sum(self.split.values(),[])
        self.assertEqual(len(flat),256)
        self.assertEqual(set(flat),set(range(256)))

    def test_every_planned_donor_is_in_same_split(self):
        for name,ids in self.split.items():
            members=set(ids)
            for w in ids:
                self.assertIn(w^4,members)
                self.assertIn(w^8,members)

    def test_stratification_and_family_sizes(self):
        _,y,_=worlds()
        for name,ids in self.split.items():
            self.assertEqual(len(ids),4*self.config["partition_families"][name])
            self.assertEqual(int(y[ids].sum()),2*self.config["positive_family_strata"][name])

    def test_irrelevant_grant_preserves_task_truth(self):
        x,y,_=worlds()
        for w in range(256):
            selected=int(x[w,6]>0)
            irrelevant=w^(1<<(3-selected))
            self.assertEqual(y[w],y[irrelevant])

    def test_batch_only_intervenes_on_named_unit(self):
        x,_,_=worlds()
        ids=np.array(self.split["test"][:4])
        xb=np.column_stack((x[ids],np.zeros((4,2))))
        c,d,e,features,kinds,world_ids,units=batch(Network(97),xb,ids)
        self.assertEqual(d.shape,(4*24*2,24))
        outside=d.copy();outside[np.arange(len(d)),units]=0
        self.assertEqual(float(np.abs(outside).sum()),0)
        self.assertEqual(set(kinds),{"selected_grant","unselected_grant"})


if __name__=="__main__":
    unittest.main()
