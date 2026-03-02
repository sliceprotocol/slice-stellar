/**
 * Test script for Soroban read hooks
 * 
 * Usage:
 *   npx tsx scripts/test-soroban-hooks.ts
 * 
 * Prerequisites:
 *   - Environment variables set in .env.local
 *   - Contract deployed to testnet
 *   - At least one dispute created
 */

import { simulateContractView, scValToNative } from '../src/util/sorobanClient';
import { nativeToScVal } from '@stellar/stellar-sdk';

async function testDisputeCount() {
  console.log('\n📊 Testing get_dispute_count...');
  try {
    const countXdr = await simulateContractView('get_dispute_count', []);
    const count = scValToNative(countXdr);
    console.log('✅ Total disputes:', count);
    return count;
  } catch (error) {
    console.error('❌ Failed:', error);
    return 0;
  }
}

async function testGetDispute(id: number) {
  console.log(`\n🔍 Testing get_dispute(${id})...`);
  try {
    const idScVal = nativeToScVal(id, { type: 'u64' });
    const disputeXdr = await simulateContractView('get_dispute', [idScVal]);
    const dispute = scValToNative(disputeXdr);
    
    console.log('✅ Dispute fetched successfully:');
    console.log('  ID:', dispute.id);
    console.log('  Claimer:', dispute.claimer);
    console.log('  Defender:', dispute.defender);
    console.log('  Status:', dispute.status);
    console.log('  Category:', dispute.category);
    console.log('  Jurors Required:', dispute.jurors_required);
    
    return dispute;
  } catch (error) {
    console.error('❌ Failed:', error);
    return null;
  }
}

async function testTransformation() {
  console.log('\n🔄 Testing data transformation...');
  try {
    const { transformDisputeData } = await import('../src/util/disputeAdapter');
    
    // Mock on-chain data
    const mockOnChain = {
      id: BigInt(1),
      claimer: 'GBZXN7PIRZGNMHGAH7B27SSEDBM7J4ORL2VYSXDM2R4GJ3EDT4K7W2ZB',
      defender: 'GC6HBWKBUDK4WAFM3I7CPS7FCOXG4MJXOG7T3VKR7NY4CKELNC2I2E4F',
      meta_hash: new Uint8Array(32),
      min_amount: BigInt(1000000),
      max_amount: BigInt(10000000),
      category: 'test',
      allowed_jurors: null,
      jurors_required: 3,
      deadline_pay_seconds: BigInt(Math.floor(Date.now() / 1000) + 86400),
      deadline_commit_seconds: BigInt(Math.floor(Date.now() / 1000) + 86400),
      deadline_reveal_seconds: BigInt(Math.floor(Date.now() / 1000) + 172800),
      assigned_jurors: [],
      juror_stakes: [BigInt(50000000)],
      commitments: [],
      revealed_votes: [],
      revealed_salts: [],
      status: 1,
      claimer_paid: true,
      defender_paid: true,
      claimer_amount: BigInt(5000000),
      defender_amount: BigInt(5000000),
      winner: null,
    };
    
    const result = transformDisputeData(mockOnChain, null);
    
    console.log('✅ Transformation successful:');
    console.log('  ID:', result.id);
    console.log('  Phase:', result.phase);
    console.log('  Stake:', result.stake, 'XLM');
    console.log('  Deadline:', result.deadlineLabel);
    console.log('  Urgent:', result.isUrgent);
    
    return result;
  } catch (error) {
    console.error('❌ Failed:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 Soroban Read Hooks Test Suite\n');
  console.log('Environment:');
  console.log('  RPC URL:', process.env.NEXT_PUBLIC_STELLAR_RPC_URL || '❌ NOT SET');
  console.log('  Contract:', process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT || '❌ NOT SET');
  console.log('  Network:', process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015');
  
  if (!process.env.NEXT_PUBLIC_STELLAR_RPC_URL || !process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT) {
    console.error('\n❌ Missing required environment variables!');
    console.error('Please set NEXT_PUBLIC_STELLAR_RPC_URL and NEXT_PUBLIC_STELLAR_SLICE_CONTRACT');
    process.exit(1);
  }
  
  // Test 1: Get dispute count
  const count = await testDisputeCount();
  
  // Test 2: Get first dispute (if exists)
  if (count > 0) {
    await testGetDispute(1);
  } else {
    console.log('\n⚠️  No disputes found. Create a dispute first to test get_dispute.');
  }
  
  // Test 3: Test transformation
  await testTransformation();
  
  console.log('\n✨ Test suite complete!\n');
}

main().catch(console.error);
