import { Search, SlidersHorizontal } from "lucide-react";
import { LINK_STATUS_LABELS } from "../domain/lead";
import type { LeadFilters as LeadFilterValue } from "../data/selectors";
import { POSSIBLE_JOIN_LABELS } from "../domain/lead";
import { Button } from "./Button";

interface LeadFiltersProps {
  value: LeadFilterValue;
  onChange: (next: LeadFilterValue) => void;
  cities: string[];
  compact?: boolean;
}

export function LeadFilters({
  value,
  onChange,
  cities,
  compact = false,
}: LeadFiltersProps) {
  const update = <Key extends keyof LeadFilterValue>(
    key: Key,
    nextValue: LeadFilterValue[Key],
  ) => onChange({ ...value, [key]: nextValue });

  return (
    <section
      aria-label="线索筛选"
      className={compact ? "filter-bar filter-bar--compact" : "filter-bar"}
    >
      <label className="search-field">
        <Search aria-hidden="true" size={17} />
        <span className="sr-only">搜索司机ID或手机号</span>
        <input
          aria-label="搜索司机ID或手机号"
          onChange={(event) => update("search", event.target.value)}
          placeholder="搜索司机ID、手机号、姓名"
          type="search"
          value={value.search}
        />
      </label>

      <label className="field">
        <span>来源</span>
        <select
          onChange={(event) =>
            update("source", event.target.value as LeadFilterValue["source"])
          }
          value={value.source}
        >
          <option value="all">全部来源</option>
          <option value="cyf">CYF 线索</option>
          <option value="offline">线下线索</option>
        </select>
      </label>

      <label className="field">
        <span>城市</span>
        <select
          onChange={(event) => update("city", event.target.value)}
          value={value.city}
        >
          <option value="all">全部城市</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>外呼状态</span>
        <select
          onChange={(event) =>
            update(
              "linkStatus",
              event.target.value === "all"
                ? "all"
                : (Number(event.target.value) as LeadFilterValue["linkStatus"]),
            )
          }
          value={value.linkStatus}
        >
          <option value="all">全部状态</option>
          {Object.entries(LINK_STATUS_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>加盟意向</span>
        <select
          onChange={(event) =>
            update(
              "possibleJoin",
              event.target.value === "all"
                ? "all"
                : (Number(event.target.value) as LeadFilterValue["possibleJoin"]),
            )
          }
          value={value.possibleJoin}
        >
          <option value="all">全部意向</option>
          {Object.entries(POSSIBLE_JOIN_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>同步状态</span>
        <select
          onChange={(event) =>
            update("syncState", event.target.value as LeadFilterValue["syncState"])
          }
          value={value.syncState}
        >
          <option value="all">全部状态</option>
          <option value="synced">已同步</option>
          <option value="pending">待同步</option>
          <option value="conflict">有冲突</option>
          <option value="failed">同步失败</option>
          <option value="local_only">仅本地</option>
        </select>
      </label>

      {compact ? (
        <Button icon={<SlidersHorizontal aria-hidden="true" size={16} />}>
          筛选
        </Button>
      ) : null}
    </section>
  );
}
