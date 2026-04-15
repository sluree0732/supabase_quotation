"""
CSV 원본(data/업종코드-표준산업분류 연계표.csv) →
src/data/ksic.json 변환 스크립트

실행: python scripts/parse-ksic.py
"""
import csv
import json
import os
from collections import defaultdict, OrderedDict

INPUT = os.path.join(os.path.dirname(__file__), '..', 'data', '업종코드-표준산업분류 연계표.csv')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'ksic.json')

def parse():
    with open(INPUT, encoding='utf-8-sig') as f:
        rows = list(csv.reader(f))

    # 8행(index 7)부터 실제 데이터
    data_rows = [r for r in rows[7:] if r[0].strip().isdigit()]

    type_names: dict[str, str] = OrderedDict()   # 대분류 코드 → 명칭 (순서 유지)
    type_items: dict[str, set] = defaultdict(set)  # 대분류 코드 → 세세분류명 집합

    for r in data_rows:
        # '+' 표기 행 제외 (인적용역 중복분류)
        if '+' in r[12]:
            continue

        type_code = r[2].strip()   # 대분류 코드 (A, B, C ...)
        type_name = r[3].strip()   # 대분류명
        sub_name  = r[10].strip()  # 세세분류명

        if not type_code or not type_name or not sub_name:
            continue

        type_names[type_code] = type_name
        type_items[type_code].add(sub_name)

    result = [
        {
            'code': code,
            'name': type_names[code],
            'items': sorted(type_items[code]),
        }
        for code in type_names
    ]

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    total_items = sum(len(r['items']) for r in result)
    print(f'완료: {len(result)}개 대분류, {total_items}개 세세분류')
    print(f'출력: {OUTPUT}')

if __name__ == '__main__':
    parse()
