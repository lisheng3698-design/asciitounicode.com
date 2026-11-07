const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({window:{},TextEncoder,TextDecoder,URLSearchParams,Intl});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../utility-tools.js'),'utf8'),context);
const c=context.window.asciiUnicodeUtilities.converters;
const run=(slug,input,format)=>c[slug](input,format);
test('RFC 4648 vectors and canonical padding bits',()=>{
 const vectors=[['f','MY======'],['fo','MZXQ===='],['foo','MZXW6==='],['foob','MZXW6YQ='],['fooba','MZXW6YTB'],['foobar','MZXW6YTBOI======']];
 for(const [text,encoded] of vectors){assert.equal(run('base32-encoder',text,'input-text').output,encoded);assert.equal(run('base32-decoder',encoded,'output-text').output,text);assert.equal(run('base32-decoder',encoded.replace(/=/g,'').toLowerCase(),'output-text').output,text);}
 for(const input of ['MZ======','MY=====','A','MY=======','MY======A','01','MZXW6=='])assert.equal(run('base32-decoder',input,'output-text').output,'');
 assert.equal(run('base32-encoder','0000','input-hex').output,'AAAA====');
 assert.equal(run('base32-decoder','74======','output-text').warning,'warningCodecUtf8');
 assert.equal(run('base32-decoder','74======','output-hex').output,'FF');
});
test('Base58 leading zeros, full byte alphabet, UTF-8, limits and invalid symbols',()=>{
 const hex=Array.from({length:256},(_,i)=>i.toString(16).padStart(2,'0')).join('').toUpperCase();
 const encoded=run('base58-encoder',hex,'input-hex').output;
 assert.equal(run('base58-decoder',encoded,'output-hex').output,hex);
 for(const [h,v] of [['000000','111'],['000001','112'],['48656C6C6F','9Ajdvzr']]){assert.equal(run('base58-encoder',h,'input-hex').output,v);assert.equal(run('base58-decoder',v,'output-hex').output,h);}
 assert.equal(run('base58-decoder','9Ajdvzr','output-text').output,'Hello');
 for(const v of ['0','O','I','l','1 1'])assert.equal(run('base58-decoder',v,'output-hex').warning,'warningBase58');
 assert.equal(run('base58-encoder','a'.repeat(4097),'input-text').warning,'warningBase58Limit');
 assert.equal(run('base58-decoder','1'.repeat(4097),'output-hex').warning,'warningBase58Limit');
});
test('URL modes distinguish spaces, literal plus and RFC reserved punctuation',()=>{
 assert.equal(run('url-encoder','a b+','url-form').output,'a+b%2B');
 assert.equal(run('url-encoder',"!'()*",'url-rfc3986').output,'%21%27%28%29%2A');
 assert.equal(run('url-encoder',"!'()*",'url-component').output,"!'()*");
 assert.equal(run('url-encoder','\ud800','url-component').warning,'warningCodecInput');
});
test('Normalization compatibility and grapheme reversal are explicit',()=>{
 assert.equal(run('unicode-normalizer','e\u0301','NFC').output,'é');
 assert.equal(run('unicode-normalizer','①Ａ','NFKC').output,'1A');
 assert.equal(run('unicode-normalizer','①Ａ','NFKC').warning,'warningCompatibility');
 assert.equal(run('text-reverser','A👩‍💻e\u0301','reverse-graphemes').output,'e\u0301👩‍💻A');
 assert.equal(run('text-reverser','one  two\nthree','reverse-words').output,'three  two\none');
 assert.equal(run('slug-generator','你好 café','slug-ascii').output,'cafe');
 assert.equal(run('slug-generator','你好 café','slug-ascii').warning,'warningSlugLoss');
});
test('CSV preserves quoted delimiters, multiline data, identifiers and safe property keys',()=>{
 const result=run('csv-to-json','\uFEFFname,code,note\r\nAda,001,"a,b\n""quoted"""\r\n','csv-comma');
 assert.deepEqual(JSON.parse(result.output),[{name:'Ada',code:'001',note:'a,b\n"quoted"'}]);
 assert.deepEqual(JSON.parse(run('csv-to-json','__proto__,constructor\nx,y','csv-comma').output),[{['__proto__']:'x',constructor:'y'}]);
 for(const input of ['a,a\nx,y','a,\nx,y','a,b\nx','a\n"x"z','a\n"x'])assert.ok(run('csv-to-json',input,'csv-comma').warning);
 const rows='[{"a":"x,y","b":"a\\nb"},{"b":null,"c":{"z":1}}]';
 assert.equal(run('json-to-csv',rows,'csv-comma').output,'"a","b","c"\r\n"x,y","a\nb",""\r\n"","","{""z"":1}"');
 for(const value of ['[{"a":9007199254740993}]','[{"a":{"b":9007199254740993}}]','[{"a":1e999}]'])assert.equal(run('json-to-csv',value,'csv-comma').warning,'warningJsonNumber');
 assert.equal(run('json-to-csv','[{"a":"001"}]','csv-comma').output,'"a"\r\n"001"');
 assert.equal(run('json-to-csv','[{"a":"=1+1"}]','csv-comma').warning,'warningCsvFormula');
});
test('Morse both directions and ROT13 round trips preserve their contracts',()=>{
 assert.equal(run('morse-code-translator','HELLO WORLD','morse-encode').output,'.... . .-.. .-.. --- / .-- --- .-. .-.. -..');
 assert.equal(run('morse-code-translator','.... . .-.. .-.. --- / .-- --- .-. .-.. -..','morse-decode').output,'HELLO WORLD');
 assert.equal(run('morse-code-translator','你好','morse-encode').warning,'warningMorse');
 assert.equal(run('morse-code-translator','... // ...','morse-decode').warning,'warningMorse');
 const s='Hello Ä 世界 123 👋';assert.equal(run('rot13',run('rot13',s).output).output,s);
});
test('Line operations keep order, final newline, empty records and selected comparison',()=>{
 assert.equal(run('line-sorter','file10\r\nfile2\r\n','sort-natural').output,'file2\nfile10\n');
 assert.equal(run('line-sorter','b\n\na\nb','sort-asc').output,'\na\nb\nb');
 assert.equal(run('duplicate-line-remover',' A \nA\n B \n','unique-trim').output,' A \n B \n');
 assert.equal(run('duplicate-line-remover','a\nA\nb\n','unique-fold').output,'a\nb\n');
 assert.equal(run('whitespace-remover','a\u00a0b\u200bc','whitespace-all').output,'ab\u200bc');
 assert.equal(run('whitespace-remover','a  b\n c\td','whitespace-collapse').output,'a b\n c d');
});
