const { execSync } = require("child_process");
const fs = require("fs");
const stacks = execSync("npx cdk ls").toString().trim().split(/\r?\n/);
const region = process.env.AWS_REGION || "us-east-1";
const out = {};
for (const s of stacks) {
  try {
    const json = execSync(`aws cloudformation describe-stacks --stack-name ${s} --region ${region} --query "Stacks[0].Outputs" --output json`, {stdio:["ignore","pipe","pipe"]}).toString();
    const arr = JSON.parse(json || "[]"); const o = {};
    arr.forEach(x => o[x.OutputKey] = x.OutputValue);
    out[s] = o;
  } catch(e) { /* ignore missing */ }
}
fs.writeFileSync("outputs.json", JSON.stringify(out, null, 2));
console.log("Wrote outputs.json");
