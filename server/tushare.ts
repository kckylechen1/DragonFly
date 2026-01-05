import axios from 'axios';

const TUSHARE_TOKEN = 'b8156c3101b24dc35261e37df85777bad3a0b74e5e85366d486417c2';
const TUSHARE_API_URL = 'http://api.tushare.pro';

interface TushareRequest {
  api_name: string;
  token: string;
  params: Record<string, any>;
  fields?: string;
}

interface TushareResponse<T = any> {
  code: number;
  msg: string | null;
  data: {
    fields: string[];
    items: any[][];
  } | null;
}

/**
 * 调用Tushare API的通用方法
 */
async function callTushareAPI<T = any>(
  apiName: string,
  params: Record<string, any> = {},
  fields?: string
): Promise<T[]> {
  try {
    const requestData: TushareRequest = {
      api_name: apiName,
      token: TUSHARE_TOKEN,
      params,
      fields,
    };

    const response = await axios.post<TushareResponse>(TUSHARE_API_URL, requestData);

    if (response.data.code !== 0) {
      throw new Error(`Tushare API error: ${response.data.msg}`);
    }

    if (!response.data.data || !response.data.data.items) {
      return [];
    }

    // 将数组格式转换为对象格式
    const { fields: fieldNames, items } = response.data.data;
    return items.map((item) => {
      const obj: any = {};
      fieldNames.forEach((field, index) => {
        obj[field] = item[index];
      });
      return obj as T;
    });
  } catch (error) {
    console.error(`Tushare API call failed for ${apiName}:`, error);
    throw error;
  }
}

/**
 * 获取股票列表
 */
export async function getStockList() {
  return callTushareAPI('stock_basic', {
    exchange: '',
    list_status: 'L',
    fields: 'ts_code,symbol,name,area,industry,market,list_date',
  });
}

/**
 * 获取实时行情（日线数据）
 */
export async function getDailyQuote(tsCode: string, tradeDate?: string) {
  const params: any = {
    ts_code: tsCode,
  };
  if (tradeDate) {
    params.trade_date = tradeDate;
  }
  
  return callTushareAPI('daily', params, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount');
}

/**
 * 获取K线数据
 */
export async function getKlineData(
  tsCode: string,
  startDate: string,
  endDate: string,
  period: 'D' | 'W' | 'M' = 'D'
) {
  let apiName = 'daily';
  if (period === 'W') {
    apiName = 'weekly';
  } else if (period === 'M') {
    apiName = 'monthly';
  }

  return callTushareAPI(apiName, {
    ts_code: tsCode,
    start_date: startDate,
    end_date: endDate,
  }, 'trade_date,open,high,low,close,vol,amount');
}

/**
 * 获取资金流向数据
 */
export async function getMoneyFlow(tsCode: string, startDate: string, endDate: string) {
  return callTushareAPI('moneyflow', {
    ts_code: tsCode,
    start_date: startDate,
    end_date: endDate,
  }, 'trade_date,buy_sm_vol,buy_sm_amount,sell_sm_vol,sell_sm_amount,buy_md_vol,buy_md_amount,sell_md_vol,sell_md_amount,buy_lg_vol,buy_lg_amount,sell_lg_vol,sell_lg_amount,buy_elg_vol,buy_elg_amount,sell_elg_vol,sell_elg_amount,net_mf_vol,net_mf_amount');
}

/**
 * 获取每日指标（PE、PB、换手率等）
 */
export async function getDailyBasic(tsCode: string, tradeDate?: string) {
  const params: any = {
    ts_code: tsCode,
  };
  if (tradeDate) {
    params.trade_date = tradeDate;
  }
  
  return callTushareAPI('daily_basic', params, 'ts_code,trade_date,close,turnover_rate,turnover_rate_f,volume_ratio,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,free_share,total_mv,circ_mv');
}

/**
 * 获取龙虎榜数据
 */
export async function getTopList(tradeDate: string) {
  return callTushareAPI('top_list', {
    trade_date: tradeDate,
  }, 'trade_date,ts_code,name,close,pct_change,turnover_rate,amount,l_sell,l_buy,l_amount,net_amount,net_rate,amount_rate,float_values,reason');
}

/**
 * 搜索股票（通过代码或名称）
 */
export async function searchStock(keyword: string) {
  const allStocks = await getStockList();
  
  // 搜索匹配代码或名称的股票
  return allStocks.filter((stock: any) => {
    const code = stock.symbol || '';
    const name = stock.name || '';
    return code.includes(keyword) || name.includes(keyword);
  }).slice(0, 20); // 限制返回20条
}

/**
 * 将Tushare的ts_code转换为6位代码
 * 例如: 000001.SZ -> 000001
 */
export function tsCodeToCode(tsCode: string): string {
  return tsCode.split('.')[0] || tsCode;
}

/**
 * 将6位代码转换为Tushare的ts_code
 * 例如: 000001 -> 000001.SZ (根据代码前缀判断市场)
 */
export function codeToTsCode(code: string): string {
  if (code.length !== 6) {
    return code;
  }
  
  // 60开头是上海，其他是深圳
  const market = code.startsWith('6') ? 'SH' : 'SZ';
  return `${code}.${market}`;
}

/**
 * 格式化日期为Tushare格式 (YYYYMMDD)
 */
export function formatDateForTushare(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 将Tushare日期格式转换为标准格式 (YYYYMMDD -> YYYY-MM-DD)
 */
export function formatTushareDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) {
    return dateStr;
  }
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}
