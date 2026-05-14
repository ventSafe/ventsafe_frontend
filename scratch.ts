import forge from 'node-forge';

function createDeterministicPRNG(seed: string) {
    const md = forge.md.sha256.create();
    md.update(seed);
    let state = md.digest().getBytes();
    
    return {
        getBytesSync: function(size: number) {
            let bytes = '';
            while(bytes.length < size) {
                const md2 = forge.md.sha256.create();
                md2.update(state);
                state = md2.digest().getBytes();
                bytes += state;
            }
            return bytes.slice(0, size);
        }
    };
}

console.log("Generating key 1...");
const prng1 = createDeterministicPRNG("my secret seed 1");
const keypair1 = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 0x10001, prng: prng1 });
console.log("Key 1:", forge.pki.publicKeyToPem(keypair1.publicKey).substring(0, 80));

console.log("Generating key 2...");
const prng2 = createDeterministicPRNG("my secret seed 1");
const keypair2 = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 0x10001, prng: prng2 });
console.log("Key 2:", forge.pki.publicKeyToPem(keypair2.publicKey).substring(0, 80));
