"use strict";

/**
 * 8-bit AVR Instruction set written in Javascript
 * by Andor Polgar (hngrhorace) 2013
 * 
 * 
 * 
 * Nomenclature
 * 
 * Status register (SREG)
 * SREG: Status register
 * C:    Carry Flag
 * Z:    Zero Flag
 * N:    Negative Flag
 * V:    Two's complement overflow indicator
 * S:    N ^ V, For signed tests
 * H:    Half Carry Flag
 * T:    Transfer bit used by BLD and BST instructions
 * I:    Global Interrupt Enable/Disable Flag
 * 
 * Registers and Operands
 * Rd:      Destination (and source) register in the Register File
 * Rr:      Source register
 * R:       Result after instruction is executed
 * K:       Constant data
 * k:       Constant address
 * b:       Bit in the Register File or I/O Register (3-bit)
 * s:       Bit in the Status Register (3-bit)
 * X, Y, Z: Indirect Address Register
 * A:       I/O location address
 * q:       Displacement for direct addressing (6-bit)
 * 
 */
var avr = {
	/** Program counter */
	PC: 0,
	/** Stack pointer */
	SP: 8,
	SPL: 0,
	SPH: 0,
	/** SREG */
	sreg: {
		7: false, /* I - Global interrupt enable */
		6: false, /* T - Bit Copy Storage */
		5: false, /* H - Half Carry Flag */
		4: false, /* S - Sign Bit */
		3: false, /* V - Two's Complement Overflow Flag */
		2: false, /* N - Negative Flag */
		1: false, /* Z - Zero flag */
		0: false /*  C - Carry flag */
	},
	/**
	 * General Purpose Register File
	 * 
	 *     0       1       2       3       4       5       6       7
	 * .-------.-------.-------.-------.-------.-------.-------.-------.
	 * |  LSB  |       |       |       |       |       |       |  MSB  |
	 * '-------'-------'-------'-------'-------'-------'-------'-------'
	 */
	reg: {
		/*    MSB                                              LSB        Data Memory Address */
		r0: [false, false, false, false, false, false, false, false], /*  0x00    R0  */
		r1: [false, false, false, false, false, false, false, false], /*  0x01    R1  */
		r2: [false, false, false, false, false, false, false, false], /*  0x02    R2  */
		r3: [false, false, false, false, false, false, false, false], /*  0x03    R3  */
		r4: [false, false, false, false, false, false, false, false], /*  0x04    R4  */
		r5: [false, false, false, false, false, false, false, false], /*  0x05    R5  */
		r6: [false, false, false, false, false, false, false, false], /*  0x06    R6  */
		r7: [false, false, false, false, false, false, false, false], /*  0x07    R7  */
		r8: [false, false, false, false, false, false, false, false], /*  0x08    R8  */
		r9: [false, false, false, false, false, false, false, false], /*  0x09    R9  */
		r10: [false, false, false, false, false, false, false, false], /* 0x0A    R10 */
		r11: [false, false, false, false, false, false, false, false], /* 0x0B    R11 */
		r12: [false, false, false, false, false, false, false, false], /* 0x0C    R12 */
		r13: [false, false, false, false, false, false, false, false], /* 0x0D    R13 */
		r14: [false, false, false, false, false, false, false, false], /* 0x0E    R14 */
		r15: [false, false, false, false, false, false, false, false], /* 0x0F    R15 */

		r16: [false, false, false, false, false, false, false, false], /* 0x10    R16 */
		r17: [false, false, false, false, false, false, false, false], /* 0x11    R17 */
		r18: [false, false, false, false, false, false, false, false], /* 0x12    R18 */
		r19: [false, false, false, false, false, false, false, false], /* 0x13    R19 */
		r20: [false, false, false, false, false, false, false, false], /* 0x14    R20 */
		r21: [false, false, false, false, false, false, false, false], /* 0x15    R21 */
		r22: [false, false, false, false, false, false, false, false], /* 0x16    R22 */
		r23: [false, false, false, false, false, false, false, false], /* 0x17    R23 */
		r24: [false, false, false, false, false, false, false, false], /* 0x18    R24 */
		r25: [false, false, false, false, false, false, false, false], /* 0x19    R25 */
		r26: [false, false, false, false, false, false, false, false], /* 0x1A    R26    X-register Low Byte */
		r27: [false, false, false, false, false, false, false, false], /* 0x1B    R27    X-register High Byte */
		r28: [false, false, false, false, false, false, false, false], /* 0x1C    R28    Y-register Low Byte */
		r29: [false, false, false, false, false, false, false, false], /* 0x1D    R29    Y-register High Byte */
		r30: [false, false, false, false, false, false, false, false], /* 0x1E    R30    Z-register Low Byte */
		r31: [false, false, false, false, false, false, false, false] /*  0x1F    R31    Z-register High Byte */
	},
	/**
	 * Register Space    0x00 - 0xFF
	 * 
	 *     0       1       2       3       4       5       6       7
	 * .-------.-------.-------.-------.-------.-------.-------.-------.
	 * |  LSB  |       |       |       |       |       |       |  MSB  |
	 * '-------'-------'-------'-------'-------'-------'-------'-------'
	 */
	databus: [
		[false, false, false, false, false, false, false, false], /* 0x00 */
		[false, false, false, false, false, false, false, false], /* 0x01 */
		[false, false, false, false, false, false, false, false], /* 0x02 */
		[false, false, false, false, false, false, false, false], /* 0x03 */
		[false, false, false, false, false, false, false, false], /* 0x04 */
		[false, false, false, false, false, false, false, false], /* 0x05 */
		[false, false, false, false, false, false, false, false], /* 0x06 */
		[false, false, false, false, false, false, false, false], /* 0x07 */
		[false, false, false, false, false, false, false, false], /* 0x08 */
		[false, false, false, false, false, false, false, false], /* 0x09 */
		[false, false, false, false, false, false, false, false], /* 0x0A */
		[false, false, false, false, false, false, false, false], /* 0x0B */
		[false, false, false, false, false, false, false, false], /* 0x0C */
		[false, false, false, false, false, false, false, false], /* 0x0D */
		[false, false, false, false, false, false, false, false], /* 0x0E */
		[false, false, false, false, false, false, false, false], /* 0x0F */

		[false, false, false, false, false, false, false, false], /* 0x10 */
		[false, false, false, false, false, false, false, false], /* 0x11 */
		[false, false, false, false, false, false, false, false], /* 0x12 */
		[false, false, false, false, false, false, false, false], /* 0x13 */
		[false, false, false, false, false, false, false, false], /* 0x14 */
		[false, false, false, false, false, false, false, false], /* 0x15 */
		[false, false, false, false, false, false, false, false], /* 0x16 */
		[false, false, false, false, false, false, false, false], /* 0x17 */
		[false, false, false, false, false, false, false, false], /* 0x18 */
		[false, false, false, false, false, false, false, false], /* 0x19 */
		[false, false, false, false, false, false, false, false], /* 0x1A */
		[false, false, false, false, false, false, false, false], /* 0x1B */
		[false, false, false, false, false, false, false, false], /* 0x1C */
		[false, false, false, false, false, false, false, false], /* 0x1D */
		[false, false, false, false, false, false, false, false], /* 0x1E */
		[false, false, false, false, false, false, false, false], /* 0x1F */

		[false, false, false, false, false, false, false, false], /* 0x20 */
		[false, false, false, false, false, false, false, false], /* 0x21 */
		[false, false, false, false, false, false, false, false], /* 0x22 */
		[false, false, false, false, false, false, false, false], /* 0x23 */
		[false, false, false, false, false, false, false, false], /* 0x24 */
		[false, false, false, false, false, false, false, false], /* 0x25 */
		[false, false, false, false, false, false, false, false], /* 0x26 */
		[false, false, false, false, false, false, false, false], /* 0x27 */
		[false, false, false, false, false, false, false, false], /* 0x28 */
		[false, false, false, false, false, false, false, false], /* 0x29 */
		[false, false, false, false, false, false, false, false], /* 0x2A */
		[false, false, false, false, false, false, false, false], /* 0x2B */
		[false, false, false, false, false, false, false, false], /* 0x2C */
		[false, false, false, false, false, false, false, false], /* 0x2D */
		[false, false, false, false, false, false, false, false], /* 0x2E */
		[false, false, false, false, false, false, false, false], /* 0x2F */

		[false, false, false, false, false, false, false, false], /* 0x30 */
		[false, false, false, false, false, false, false, false], /* 0x31 */
		[false, false, false, false, false, false, false, false], /* 0x32 */
		[false, false, false, false, false, false, false, false], /* 0x33 */
		[false, false, false, false, false, false, false, false], /* 0x34 */
		[false, false, false, false, false, false, false, false], /* 0x35 */
		[false, false, false, false, false, false, false, false], /* 0x36 */
		[false, false, false, false, false, false, false, false], /* 0x37 */
		[false, false, false, false, false, false, false, false], /* 0x38 */
		[false, false, false, false, false, false, false, false], /* 0x39 */
		[false, false, false, false, false, false, false, false], /* 0x3A */
		[false, false, false, false, false, false, false, false], /* 0x3B */
		[false, false, false, false, false, false, false, false], /* 0x3C */
		[false, false, false, false, false, false, false, false], /* 0x3D */
		[false, false, false, false, false, false, false, false], /* 0x3E */
		[false, false, false, false, false, false, false, false], /* 0x3F */

		[false, false, false, false, false, false, false, false], /* 0x40 */
		[false, false, false, false, false, false, false, false], /* 0x41 */
		[false, false, false, false, false, false, false, false], /* 0x42 */
		[false, false, false, false, false, false, false, false], /* 0x43 */
		[false, false, false, false, false, false, false, false], /* 0x44 */
		[false, false, false, false, false, false, false, false], /* 0x45 */
		[false, false, false, false, false, false, false, false], /* 0x46 */
		[false, false, false, false, false, false, false, false], /* 0x47 */
		[false, false, false, false, false, false, false, false], /* 0x48 */
		[false, false, false, false, false, false, false, false], /* 0x49 */
		[false, false, false, false, false, false, false, false], /* 0x4A */
		[false, false, false, false, false, false, false, false], /* 0x4B */
		[false, false, false, false, false, false, false, false], /* 0x4C */
		[false, false, false, false, false, false, false, false], /* 0x4D */
		[false, false, false, false, false, false, false, false], /* 0x4E */
		[false, false, false, false, false, false, false, false], /* 0x4F */

		[false, false, false, false, false, false, false, false], /* 0x50 */
		[false, false, false, false, false, false, false, false], /* 0x51 */
		[false, false, false, false, false, false, false, false], /* 0x52 */
		[false, false, false, false, false, false, false, false], /* 0x53 */
		[false, false, false, false, false, false, false, false], /* 0x54 */
		[false, false, false, false, false, false, false, false], /* 0x55 */
		[false, false, false, false, false, false, false, false], /* 0x56 */
		[false, false, false, false, false, false, false, false], /* 0x57 */
		[false, false, false, false, false, false, false, false], /* 0x58 */
		[false, false, false, false, false, false, false, false], /* 0x59 */
		[false, false, false, false, false, false, false, false], /* 0x5A */
		[false, false, false, false, false, false, false, false], /* 0x5B */
		[false, false, false, false, false, false, false, false], /* 0x5C */
		[false, false, false, false, false, false, false, false], /* 0x5D */
		[false, false, false, false, false, false, false, false], /* 0x5E */
		[false, false, false, false, false, false, false, false], /* 0x5F */

		[false, false, false, false, false, false, false, false], /* 0x60 */
		[false, false, false, false, false, false, false, false], /* 0x61 */
		[false, false, false, false, false, false, false, false], /* 0x62 */
		[false, false, false, false, false, false, false, false], /* 0x63 */
		[false, false, false, false, false, false, false, false], /* 0x64 */
		[false, false, false, false, false, false, false, false], /* 0x65 */
		[false, false, false, false, false, false, false, false], /* 0x66 */
		[false, false, false, false, false, false, false, false], /* 0x67 */
		[false, false, false, false, false, false, false, false], /* 0x68 */
		[false, false, false, false, false, false, false, false], /* 0x69 */
		[false, false, false, false, false, false, false, false], /* 0x6A */
		[false, false, false, false, false, false, false, false], /* 0x6B */
		[false, false, false, false, false, false, false, false], /* 0x6C */
		[false, false, false, false, false, false, false, false], /* 0x6D */
		[false, false, false, false, false, false, false, false], /* 0x6E */
		[false, false, false, false, false, false, false, false], /* 0x6F */

		[false, false, false, false, false, false, false, false], /* 0x70 */
		[false, false, false, false, false, false, false, false], /* 0x71 */
		[false, false, false, false, false, false, false, false], /* 0x72 */
		[false, false, false, false, false, false, false, false], /* 0x73 */
		[false, false, false, false, false, false, false, false], /* 0x74 */
		[false, false, false, false, false, false, false, false], /* 0x75 */
		[false, false, false, false, false, false, false, false], /* 0x76 */
		[false, false, false, false, false, false, false, false], /* 0x77 */
		[false, false, false, false, false, false, false, false], /* 0x78 */
		[false, false, false, false, false, false, false, false], /* 0x79 */
		[false, false, false, false, false, false, false, false], /* 0x7A */
		[false, false, false, false, false, false, false, false], /* 0x7B */
		[false, false, false, false, false, false, false, false], /* 0x7C */
		[false, false, false, false, false, false, false, false], /* 0x7D */
		[false, false, false, false, false, false, false, false], /* 0x7E */
		[false, false, false, false, false, false, false, false], /* 0x7F */

		[false, false, false, false, false, false, false, false], /* 0x80 */
		[false, false, false, false, false, false, false, false], /* 0x81 */
		[false, false, false, false, false, false, false, false], /* 0x82 */
		[false, false, false, false, false, false, false, false], /* 0x83 */
		[false, false, false, false, false, false, false, false], /* 0x84 */
		[false, false, false, false, false, false, false, false], /* 0x85 */
		[false, false, false, false, false, false, false, false], /* 0x86 */
		[false, false, false, false, false, false, false, false], /* 0x87 */
		[false, false, false, false, false, false, false, false], /* 0x88 */
		[false, false, false, false, false, false, false, false], /* 0x89 */
		[false, false, false, false, false, false, false, false], /* 0x8A */
		[false, false, false, false, false, false, false, false], /* 0x8B */
		[false, false, false, false, false, false, false, false], /* 0x8C */
		[false, false, false, false, false, false, false, false], /* 0x8D */
		[false, false, false, false, false, false, false, false], /* 0x8E */
		[false, false, false, false, false, false, false, false], /* 0x8F */

		[false, false, false, false, false, false, false, false], /* 0x90 */
		[false, false, false, false, false, false, false, false], /* 0x91 */
		[false, false, false, false, false, false, false, false], /* 0x92 */
		[false, false, false, false, false, false, false, false], /* 0x93 */
		[false, false, false, false, false, false, false, false], /* 0x94 */
		[false, false, false, false, false, false, false, false], /* 0x95 */
		[false, false, false, false, false, false, false, false], /* 0x96 */
		[false, false, false, false, false, false, false, false], /* 0x97 */
		[false, false, false, false, false, false, false, false], /* 0x98 */
		[false, false, false, false, false, false, false, false], /* 0x99 */
		[false, false, false, false, false, false, false, false], /* 0x9A */
		[false, false, false, false, false, false, false, false], /* 0x9B */
		[false, false, false, false, false, false, false, false], /* 0x9C */
		[false, false, false, false, false, false, false, false], /* 0x9D */
		[false, false, false, false, false, false, false, false], /* 0x9E */
		[false, false, false, false, false, false, false, false], /* 0x9F */

		[false, false, false, false, false, false, false, false], /* 0xA0 */
		[false, false, false, false, false, false, false, false], /* 0xA1 */
		[false, false, false, false, false, false, false, false], /* 0xA2 */
		[false, false, false, false, false, false, false, false], /* 0xA3 */
		[false, false, false, false, false, false, false, false], /* 0xA4 */
		[false, false, false, false, false, false, false, false], /* 0xA5 */
		[false, false, false, false, false, false, false, false], /* 0xA6 */
		[false, false, false, false, false, false, false, false], /* 0xA7 */
		[false, false, false, false, false, false, false, false], /* 0xA8 */
		[false, false, false, false, false, false, false, false], /* 0xA9 */
		[false, false, false, false, false, false, false, false], /* 0xAA */
		[false, false, false, false, false, false, false, false], /* 0xAB */
		[false, false, false, false, false, false, false, false], /* 0xAC */
		[false, false, false, false, false, false, false, false], /* 0xAD */
		[false, false, false, false, false, false, false, false], /* 0xAE */
		[false, false, false, false, false, false, false, false], /* 0xAF */

		[false, false, false, false, false, false, false, false], /* 0xB0 */
		[false, false, false, false, false, false, false, false], /* 0xB1 */
		[false, false, false, false, false, false, false, false], /* 0xB2 */
		[false, false, false, false, false, false, false, false], /* 0xB3 */
		[false, false, false, false, false, false, false, false], /* 0xB4 */
		[false, false, false, false, false, false, false, false], /* 0xB5 */
		[false, false, false, false, false, false, false, false], /* 0xB6 */
		[false, false, false, false, false, false, false, false], /* 0xB7 */
		[false, false, false, false, false, false, false, false], /* 0xB8 */
		[false, false, false, false, false, false, false, false], /* 0xB9 */
		[false, false, false, false, false, false, false, false], /* 0xBA */
		[false, false, false, false, false, false, false, false], /* 0xBB */
		[false, false, false, false, false, false, false, false], /* 0xBC */
		[false, false, false, false, false, false, false, false], /* 0xBD */
		[false, false, false, false, false, false, false, false], /* 0xBE */
		[false, false, false, false, false, false, false, false], /* 0xBF */

		[false, false, false, false, false, false, false, false], /* 0xC0 */
		[false, false, false, false, false, false, false, false], /* 0xC1 */
		[false, false, false, false, false, false, false, false], /* 0xC2 */
		[false, false, false, false, false, false, false, false], /* 0xC3 */
		[false, false, false, false, false, false, false, false], /* 0xC4 */
		[false, false, false, false, false, false, false, false], /* 0xC5 */
		[false, false, false, false, false, false, false, false], /* 0xC6 */
		[false, false, false, false, false, false, false, false], /* 0xC7 */
		[false, false, false, false, false, false, false, false], /* 0xC8 */
		[false, false, false, false, false, false, false, false], /* 0xC9 */
		[false, false, false, false, false, false, false, false], /* 0xCA */
		[false, false, false, false, false, false, false, false], /* 0xCB */
		[false, false, false, false, false, false, false, false], /* 0xCC */
		[false, false, false, false, false, false, false, false], /* 0xCD */
		[false, false, false, false, false, false, false, false], /* 0xCE */
		[false, false, false, false, false, false, false, false], /* 0xCF */

		[false, false, false, false, false, false, false, false], /* 0xD0 */
		[false, false, false, false, false, false, false, false], /* 0xD1 */
		[false, false, false, false, false, false, false, false], /* 0xD2 */
		[false, false, false, false, false, false, false, false], /* 0xD3 */
		[false, false, false, false, false, false, false, false], /* 0xD4 */
		[false, false, false, false, false, false, false, false], /* 0xD5 */
		[false, false, false, false, false, false, false, false], /* 0xD6 */
		[false, false, false, false, false, false, false, false], /* 0xD7 */
		[false, false, false, false, false, false, false, false], /* 0xD8 */
		[false, false, false, false, false, false, false, false], /* 0xD9 */
		[false, false, false, false, false, false, false, false], /* 0xDA */
		[false, false, false, false, false, false, false, false], /* 0xDB */
		[false, false, false, false, false, false, false, false], /* 0xDC */
		[false, false, false, false, false, false, false, false], /* 0xDD */
		[false, false, false, false, false, false, false, false], /* 0xDE */
		[false, false, false, false, false, false, false, false], /* 0xDF */

		[false, false, false, false, false, false, false, false], /* 0xE0 */
		[false, false, false, false, false, false, false, false], /* 0xE1 */
		[false, false, false, false, false, false, false, false], /* 0xE2 */
		[false, false, false, false, false, false, false, false], /* 0xE3 */
		[false, false, false, false, false, false, false, false], /* 0xE4 */
		[false, false, false, false, false, false, false, false], /* 0xE5 */
		[false, false, false, false, false, false, false, false], /* 0xE6 */
		[false, false, false, false, false, false, false, false], /* 0xE7 */
		[false, false, false, false, false, false, false, false], /* 0xE8 */
		[false, false, false, false, false, false, false, false], /* 0xE9 */
		[false, false, false, false, false, false, false, false], /* 0xEA */
		[false, false, false, false, false, false, false, false], /* 0xEB */
		[false, false, false, false, false, false, false, false], /* 0xEC */
		[false, false, false, false, false, false, false, false], /* 0xED */
		[false, false, false, false, false, false, false, false], /* 0xEE */
		[false, false, false, false, false, false, false, false], /* 0xEF */

		[false, false, false, false, false, false, false, false], /* 0xF0 */
		[false, false, false, false, false, false, false, false], /* 0xF1 */
		[false, false, false, false, false, false, false, false], /* 0xF2 */
		[false, false, false, false, false, false, false, false], /* 0xF3 */
		[false, false, false, false, false, false, false, false], /* 0xF4 */
		[false, false, false, false, false, false, false, false], /* 0xF5 */
		[false, false, false, false, false, false, false, false], /* 0xF6 */
		[false, false, false, false, false, false, false, false], /* 0xF7 */
		[false, false, false, false, false, false, false, false], /* 0xF8 */
		[false, false, false, false, false, false, false, false], /* 0xF9 */
		[false, false, false, false, false, false, false, false], /* 0xFA */
		[false, false, false, false, false, false, false, false], /* 0xFB */
		[false, false, false, false, false, false, false, false], /* 0xFC */
		[false, false, false, false, false, false, false, false], /* 0xFD */
		[false, false, false, false, false, false, false, false], /* 0xFE */
		[false, false, false, false, false, false, false, false] /*  0xFF */
	],
	/**
	 * AND – Logical AND
	 * 
	 * Performs the logical AND between the contents of register Rd and register Rr 
	 * and places the result in the destination register Rd.
	 *
	 * @param _Rd    Destination register
	 * @param _Rr
	 */
	and: function(_Rd, _Rr) {

		var Rd = this.reg[_Rd];
		var Rr = this.reg[_Rr];
		/* Operation: Rd <- Rd && Rr */
		Rd[0] = Rd[0] && Rr[0];
		Rd[1] = Rd[1] && Rr[1];
		Rd[2] = Rd[2] && Rr[2];
		Rd[3] = Rd[3] && Rr[3];
		Rd[4] = Rd[4] && Rr[4];
		Rd[5] = Rd[5] && Rr[5];
		Rd[6] = Rd[6] && Rr[6];
		Rd[7] = Rd[7] && Rr[7];

		/* @TODO */
		this.sreg[4];
		/* Cleared */
		this.sreg[3] = false;
		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * ANDI – Logical AND with Immediate
	 * 
	 * Performs the logical AND between the contents of register Rd and a constant 
	 * and places the result in the destination register Rd.
	 *
	 * @param _Rd
	 * @param K
	 */
	andi: function(_Rd, K) {

		var Rd = this.reg[_Rd];

		/* Operation: Rd <- Rd && K */
		Rd[0] = Rd[0] && K[0];
		Rd[1] = Rd[1] && K[1];
		Rd[2] = Rd[2] && K[2];
		Rd[3] = Rd[3] && K[3];
		Rd[4] = Rd[4] && K[4];
		Rd[5] = Rd[5] && K[5];
		Rd[6] = Rd[6] && K[6];
		Rd[7] = Rd[7] && K[7];

		/* @TODO */
		this.sreg[4];
		/* Cleared */
		this.sreg[3] = false;
		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/** 
	 * BCLR – Bit Clear in SREG
	 * 
	 * Bit clear in SREG
	 *
	 * @param s
	 */
	bclr: function(s) {

		/* @TODO */
		this.sreg[s] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRBC – Branch if Bit in SREG is Cleared
	 * 
	 * Conditional relative branch.
	 * Tests a single bit in SREG and branches relatively to PC if the bit is cleared. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * 
	 * @param s
	 * @param k
	 */
	brbc: function(s, k) {

		/* Operation: If SREG(s) = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[s] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRBS – Branch if Bit in SREG is Set
	 * 
	 * Conditional relative branch. 
	 * Tests a single bit in SREG and branches relatively to PC if the bit is set. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * 
	 * @param s
	 * @param k
	 */
	brbs: function(s, k) {

		/* Operation: If SREG(s) = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[s] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRCC – Branch if Carry Cleared
	 * 
	 * Conditional relative branch. 
	 * Tests the Carry Flag (C) and branches relatively to PC if C is cleared. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBC 0,k).
	 * 
	 * @param k
	 */
	brcc: function(k) {

		/* Operation: If C = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[0] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRCS – Branch if Carry Set
	 * 
	 * Conditional relative branch. 
	 * Tests the Carry Flag (C) and branches relatively to PC if C is set. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBS 0,k).
	 * 
	 * @param k
	 */
	brcs: function(k) {

		/* Operation: If C = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[0] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BREAK – Break
	 * 
	 * The BREAK instruction is used by the On-chip Debug system, and is normally not used in the application software. 
	 * When the BREAK instruction is executed, the AVR CPU is set in the Stopped Mode. 
	 * This gives the On-chip Debugger access to internal resources.
	 * If any Lock bits are set, or either the JTAGEN or OCDEN Fuses are unprogrammed, 
	 * the CPU will treat the BREAK instruction as a NOP and will not enter the Stopped mode.
	 */
	'break': function() {

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BREQ – Branch if Equal
	 * 
	 * Conditional relative branch. 
	 * Tests the Zero Flag (Z) and branches relatively to PC if Z is set. 
	 * If the instruction is executed immediately after any of the instructions CP, CPI, SUB or SUBI, 
	 * the branch will occur if and only if the unsigned or signed binary number represented in Rd was equal 
	 * to the unsigned or signed binary number represented in Rr. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * (Equivalent to instruction BRBS 1,k).
	 * 
	 * @param {type} k
	 * @returns {undefined}
	 */
	breq: function(k) {

		/* Operation: If Rd = Rr (Z = 1) then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[1] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRGE – Branch if Greater or Equal (Signed)
	 * 
	 * Conditional relative branch. 
	 * Tests the Signed Flag (S) and branches relatively to PC if S is cleared. 
	 * If the instruction is executed immediately after any of the instructions CP, CPI, SUB or SUBI,
	 * the branch will occur if and only if the signed binary number represented in Rd was greater than or equal 
	 * to the signed binary number represented in Rr. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * Equivalent to instruction BRBC 4,k).
	 * 
	 * @param {type} k
	 */
	brge: function(k) {

		/* Operation: If Rd ≥ Rr (N ⊕ V = 0) then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[4] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRHC – Branch if Half Carry Flag is Cleared
	 * 
	 * Conditional relative branch. 
	 * Tests the Half Carry Flag (H) and branches relatively to PC if H is cleared. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBC 5,k).
	 * 
	 * @param k
	 */
	brhc: function(k) {

		/* Operation: If H = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[5] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRHS – Branch if Half Carry Flag is Set
	 * 
	 * Conditional relative branch. 
	 * Tests the Half Carry Flag (H) and branches relatively to PC if H is set. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBS 5,k).
	 * 
	 * @param k
	 */
	brhs: function(k) {

		/* Operation: If H = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[5] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRID – Branch if Global Interrupt is Disabled
	 * 
	 * Conditional relative branch. 
	 * Tests the Global Interrupt Flag (I) and branches relatively to PC if I is cleared. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBC 7,k).
	 * 
	 * @param k
	 */
	brid: function(k) {

		/* If I = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[7] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRIE – Branch if Global Interrupt is Enabled
	 * 
	 * Conditional relative branch. 
	 * Tests the Global Interrupt Flag (I) and branches relatively to PC if I is set.
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBS 7,k).
	 * 
	 * @param k
	 */
	brie: function(k) {

		/* If I = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[7] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRLO – Branch if Lower (Unsigned)
	 * 
	 * Conditional relative branch. 
	 * Tests the Carry Flag (C) and branches relatively to PC if C is set. 
	 * If the instruction is executed immediately after any of the instructions CP, CPI, SUB or SUBI, 
	 * the branch will occur if and only if the unsigned binary number represented in Rd was smaller 
	 * than the unsigned binary number represented in Rr. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * (Equivalent to instruction BRBS 0,k).
	 * 
	 * @param k
	 */
	brlo: function(k) {

		/* Operation: If Rd < Rr (C = 1) then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[0] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRLT – Branch if Less Than (Signed)
	 * 
	 * Conditional relative branch. 
	 * Tests the Signed Flag (S) and branches relatively to PC if S is set. 
	 * If the instruction is executed immediately after any of the instructions CP, CPI, SUB or SUBI, 
	 * the branch will occur if and only if the signed binary number represented in Rd was less 
	 * than the signed binary number represented in Rr.
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBS 4,k).
	 * 
	 * @param k
	 */
	brlt: function(k) {

		/* Operation: If Rd < Rr (N ⊕ V = 1) then PC ← PC + k + 1, else PC ← PC + 1 */
		if (this.sreg[4] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRMI – Branch if Minus
	 * 
	 * Conditional relative branch. 
	 * Tests the Negative Flag (N) and branches relatively to PC if N is set. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBS 2,k).
	 * 
	 * @param k
	 */
	brmi: function(k) {

		/* If N = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[2] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRNE – Branch if Not Equal
	 * 
	 * Conditional relative branch. 
	 * Tests the Zero Flag (Z) and branches relatively to PC if Z is cleared. 
	 * If the instruction is executed immediately after any of the instructions CP, CPI, SUB or SUBI, 
	 * the branch will occur if and only if the unsigned or signed binary number represented in Rd was not equal 
	 * to the unsigned or signed binary number represented in Rr. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * (Equivalent to instruction BRBC 1,k).
	 * 
	 * @param k
	 */
	brne: function(k) {

		/* If Rd != Rr (Z = 0) then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[1] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRPL – Branch if Plus
	 * 
	 * Conditional relative branch.
	 * Tests the Negative Flag (N) and branches relatively to PC if N is cleared.
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is brepresented in two’s complement form.
	 * (Equivalent to instruction BRBC 2,k).
	 * 
	 * @param k
	 */
	brpl: function(k) {

		/* Operation: If N = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[2] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRSH – Branch if Same or Higher (Unsigned)
	 * 
	 * Conditional relative branch. 
	 * Tests the Carry Flag (C) and branches relatively to PC if C is cleared.
	 * If the instruction is executed immediately after execution of any of the instructions CP, CPI, SUB or SUBI,
	 * the branch will occur if and only if the unsigned binary number represented in Rd was greater than or equal
	 * to the unsigned binary number represented in Rr. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * (Equivalent to instruction BRBC 0,k).
	 *
	 * @param k
	 */
	brsh: function(k) {

		/* Operation: If Rd >= Rr (C = 0) then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[0] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRTC – Branch if the T Flag is Cleared
	 * 
	 * Conditional relative branch. 
	 * Tests the T Flag and branches relatively to PC if T is cleared. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * (Equivalent to instruction BRBC 6,k).
	 * 
	 * @param k
	 */
	brtc: function(k) {

		/* Operation: If T = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[6] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRTS – Branch if the T Flag is Set
	 * 
	 * Conditional relative branch. 
	 * Tests the T Flag and branches relatively to PC if T is set.
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64).
	 * The parameter k is the offset from PC and is represented in two’s complement form.
	 * (Equivalent to instruction BRBS 6,k).
	 * 
	 * @param k
	 */
	brts: function(k) {

		/* Operation: If T = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[6] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/** 
	 * BVRC - Branch if Overflow Cleared
	 * 
	 * Conditional relative branch. 
	 * Tests the Overflow Flag (V) and branches relatively to PC if V is cleared.
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBC 3,k).
	 * 
	 * @param k
	 */
	brvc: function(k) {

		/* Operation: If V = 0 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[3] === false) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BRVS – Branch if Overflow Set
	 *
	 * Conditional relative branch. 
	 * Tests the Overflow Flag (V) and branches relatively to PC if V is set. 
	 * This instruction branches relatively to PC in either direction (PC - 63 ≤ destination ≤ PC + 64). 
	 * The parameter k is the offset from PC and is represented in two’s complement form. 
	 * (Equivalent to instruction BRBS 3,k)
	 *
	 * @param k
	 */
	brvs: function(k) {

		/** Operation: If V = 1 then PC <- PC + k + 1, else PC <- PC + 1 */
		if (this.sreg[3] === true) {
			this.PC = this.PC + k;
		}

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BSET – Bit Set in SREG
	 * 
	 * Sets a single Flag or bit in SREG.
	 * 
	 * @param s
	 */
	bset: function(s) {

		this.sreg[s] = true;
		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * BST – Bit Store from Bit in Register to T Flag in SREG
	 * 
	 * Stores bit b from Rd to the T Flag in SREG (Status Register).
	 * 
	 * @param _Rd
	 * @param b
	 */
	bst: function(_Rd, b) {

		this.sreg[6] = _Rd[b];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLC – Clear Carry Flag
	 * 
	 * Clears the Carry Flag (C) in SREG (Status Register).
	 */
	clc: function() {

		/* Carry Flag cleared */
		this.sreg[0] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLH – Clear Half Carry Flag 
	 * 
	 * Clears the Half Carry Flag (H) in SREG (Status Register). 
	 */
	clh: function() {

		/* Half Carry Flag cleared */
		this.sreg[5] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLI – Clear Global Interrupt Flag
	 * 
	 * Clears the Global Interrupt Flag (I) in SREG (Status Register). 
	 * The interrupts will be immediately disabled. 
	 * No interrupt will be executed after the CLI instruction, 
	 * even if it occurs simultaneously with the CLI instruction.
	 */
	cli: function() {

		/* Global Interrupt Flag cleared */
		this.sreg[7] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLN – Clear Negative Flag 
	 * 
	 * Clears the Negative Flag (N) in SREG (Status Register).
	 */
	cln: function() {

		/* Negative Flag cleared */
		this.sreg[2] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLR – Clear Register
	 * 
	 * Clears a register. 
	 * This instruction performs an Exclusive OR between a register and itself. 
	 * This will clear all bits in the register.
	 *
	 * @param _Rd    Destination register
	 */
	clr: function(_Rd) {

		var Rd = this.reg[_Rd];

		/* Operation: Rd <- Rd != Rd */
		Rd[0] = Rd[0] !== Rd[0];
		Rd[1] = Rd[1] !== Rd[1];
		Rd[2] = Rd[2] !== Rd[2];
		Rd[3] = Rd[3] !== Rd[3];
		Rd[4] = Rd[4] !== Rd[4];
		Rd[5] = Rd[5] !== Rd[5];
		Rd[6] = Rd[6] !== Rd[6];
		Rd[7] = Rd[7] !== Rd[7];

		this.sreg[4] = false;
		this.sreg[3] = false;
		this.sreg[2] = false;
		this.sreg[1] = true;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * CLS – Clear Signed Flag
	 * 
	 * Clears the Signed Flag (S) in SREG (Status Register). 
	 */
	cls: function() {

		/* Signed Flag cleared */
		this.sreg[4] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLT – Clear T Flag
	 * 
	 * Clears the T Flag in SREG (Status Register).
	 */
	clt: function() {

		/* T Flag cleared */
		this.sreg[6] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLV – Clear Overflow Flag
	 * 
	 * Clears the Overflow Flag (V) in SREG (Status Register).
	 */
	clv: function() {

		/* Overflow Flag cleared */
		this.sreg[3] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * CLZ – Clear Zero Flag 
	 * 
	 * Clears the Zero Flag (Z) in SREG (Status Register). 
	 */
	clz: function() {

		/* Zero Flag cleared */
		this.sreg[1] = false;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * EOR – Exclusive OR
	 * 
	 * Performs the logical EOR between the contents of register Rd and register Rr
	 * and places the result in the destination register Rd.
	 *
	 * @param _Rd
	 * @param _Rr
	 */
	eor: function(_Rd, _Rr) {

		var Rd = this.reg[_Rd];
		var Rr = this.reg[_Rr];

		/* Operation: Rd <- Rd != Rr */
		Rd[0] = Rd[0] !== Rr[0];
		Rd[1] = Rd[1] !== Rr[1];
		Rd[2] = Rd[2] !== Rr[2];
		Rd[3] = Rd[3] !== Rr[3];
		Rd[4] = Rd[4] !== Rr[4];
		Rd[5] = Rd[5] !== Rr[5];
		Rd[6] = Rd[6] !== Rr[6];
		Rd[7] = Rd[7] !== Rr[7];

		/* @TODO */
		this.sreg[4];
		/* Cleared */
		this.sreg[3] = false;
		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * JMP – Jump
	 * 
	 * Jump to an address within the entire 4M (words) Program memory. 
	 * See also RJMP.
	 * 
	 * @param k
	 */
	jmp: function(k) {

		/* @TODO */

		/* Program Counter: PC <- k */
		this.PC = k;

	},
	/**
	 * LDI – Load Immediate
	 * 
	 * Loads an 8 bit constant directly to register 16 to 31.
	 * 
	 * @param {type} _Rd
	 * @param {type} K
	 */
	ldi: function(_Rd, K) {

		var Rd = this.reg[_Rd];

		/* Operation Rd <- K */
		Rd[0] = K[0];
		Rd[1] = K[1];
		Rd[2] = K[2];
		Rd[3] = K[3];
		Rd[4] = K[4];
		Rd[5] = K[5];
		Rd[6] = K[6];
		Rd[7] = K[7];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 *  Logical Shift Left
	 *  
	 *  Shifts all bits in Rd one place to the left. 
	 *  Bit 0 is cleared. 
	 *  Bit 7 is loaded into the C Flag of the SREG. 
	 *  This operation effectively multiplies signed and unsigned values by two.
	 *  
	 *  @param _Rd
	 */
	lsl: function(_Rd) {

		var Rd = this.reg[_Rd];

		/* Set if, before the shift, the MSB of Rd was set; cleared otherwise. */
		this.sreg[0] = Rd[7];

		/* Operation */
		Rd[7] = Rd[6];
		Rd[6] = Rd[5];
		Rd[5] = Rd[4];
		Rd[4] = Rd[3];
		Rd[3] = Rd[2];
		Rd[2] = Rd[1];
		Rd[1] = Rd[0];
		Rd[0] = false;

		/* @TODO */
		this.sreg[5] = Rd[3];
		/* For signed tests. */
		this.sreg[4] = !!(this.sreg[2] ^ this.sreg[3]);
		/* For N and C after the shift. */
		this.sreg[3] = !!(this.sreg[2] ^ this.sreg[0]);
		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* Set if the result is $00; cleared otherwise */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * Logical Shift Right
	 * 
	 * Shifts all bits in Rd one place to the right. 
	 * Bit 7 is cleared. 
	 * Bit 0 is loaded into the C Flag of the SREG. 
	 * This operation effectively divides an unsigned value by two. 
	 * The C Flag can be used to round the result.
	 * 
	 * @param  _Rd
	 */
	lsr: function(_Rd) {

		Rd = this.reg[_Rd];

		/* Set if, before the shift, the LSB of Rd was set; cleared otherwise */
		this.sreg[0] = Rd[0];

		/* Operation */
		Rd[0] = Rd[1];
		Rd[1] = Rd[2];
		Rd[2] = Rd[3];
		Rd[3] = Rd[4];
		Rd[4] = Rd[5];
		Rd[5] = Rd[6];
		Rd[6] = Rd[7];
		Rd[7] = false;

		/* @TODO */
		/* For signed tests. */
		this.sreg[4] = !!(this.sreg[2] ^ this.sreg[3]);
		/* For N and C after the shift. */
		this.sreg[3] = !!(this.sreg[2] ^ this.sreg[0]);
		this.sreg[2] = false;
		/* Set if the result is $00; cleared otherwise */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * MOV – Copy Registe
	 * 
	 * This instruction makes a copy of one register into another. 
	 * The source register Rr is left unchanged, 
	 * while the destination register Rd is loaded with a copy of Rr.
	 *
	 * @param _Rd
	 * @param _Rr
	 */
	mov: function(_Rd, _Rr) {

		var Rd = this.reg[_Rd];
		var Rr = this.reg[_Rr];

		/* Operation: Rd <- Rr */
		Rd[0] = Rr[0];
		Rd[1] = Rr[1];
		Rd[2] = Rr[2];
		Rd[3] = Rr[3];
		Rd[4] = Rr[4];
		Rd[5] = Rr[5];
		Rd[6] = Rr[6];
		Rd[7] = Rr[7];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * MOVW – Copy Register Word
	 * 
	 * This instruction makes a copy of one register pair into another register pair. 
	 * The source register pair Rr+1:Rr is left unchanged, 
	 * while the destination register pair Rd+1:Rd is loaded with a copy of Rr + 1:Rr.
	 *
	 * @param _Rd
	 * @param _Rr
	 */
	movw: function(_Rd, _Rr) {

		var Rd = this.reg[_Rd];
		var Rd1 = this.reg[_Rd + 1];
		var Rr = this.reg[_Rr];
		var Rr1 = this.reg[_Rr + 1];

		/* Operation: Rd+1:Rd <- Rr+1:Rr */
		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	mul: function() {
		/* @TODO */


		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	muls: function() {
		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	mulsu: function() {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	neg: function() {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * NOP – No Operation
	 * 
	 * This instruction performs a single cycle No Operation.
	 */
	nop: function() {

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * OR – Logical OR
	 * 
	 * Performs the logical OR between the contents of register Rd and register Rr 
	 * and places the result in the destination register Rd.
	 *
	 * @param _Rd
	 * @param _Rr
	 */
	or: function(_Rd, _Rr) {

		var Rd = this.reg[_Rd];
		var Rr = this.reg[_Rr];

		/* Operation: Rd <- Rd || Rr */
		Rd[0] = Rd[0] || Rr[0];
		Rd[1] = Rd[1] || Rr[1];
		Rd[2] = Rd[2] || Rr[2];
		Rd[3] = Rd[3] || Rr[3];
		Rd[4] = Rd[4] || Rr[4];
		Rd[5] = Rd[5] || Rr[5];
		Rd[6] = Rd[6] || Rr[6];
		Rd[7] = Rd[7] || Rr[7];

		/* @TODO */
		this.sreg[4];
		/* Cleared */
		this.sreg[3] = false;
		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * ORI – Logical OR with Immediate
	 * 
	 * Performs the logical OR between the contents of register Rd and a constant 
	 * and places the result in the destination register Rd.
	 *
	 * @param _Rd
	 * @param K
	 */
	ori: function(_Rd, K) {

		var Rd = this.reg[_Rd];

		/* Operation: Rd <- Rd v K */
		Rd[0] = Rd[0] || K[0];
		Rd[1] = Rd[1] || K[1];
		Rd[2] = Rd[2] || K[2];
		Rd[3] = Rd[3] || K[3];
		Rd[4] = Rd[4] || K[4];
		Rd[5] = Rd[5] || K[5];
		Rd[6] = Rd[6] || K[6];
		Rd[7] = Rd[7] || K[7];

		/* @TODO */
		this.sreg[4];
		/* Cleared */
		this.sreg[3] = false;
		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * OUT – Store Register to I/O Location
	 * 
	 * Stores data from register Rr in the Register File to I/O Space (Ports, Timers, Configuration Registers etc.).
	 * 
	 * @param A
	 * @param _Rr
	 */
	out: function(A, _Rr) {

		/* @TODO */

	},
	/**
	 * POP – Pop Register from Stack
	 * 
	 * This instruction loads register Rd with a byte from the STACK. 
	 * The Stack Pointer is pre-incremented by 1 before the POP.
	 *
	 * @param _Rd
	 */
	pop: function(_Rd) {

		this.SP++;

		/* Rd <- STACK */
		this.reg[_Rd] = this.stack[this.SP];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * PUSH – Push Register on Stack
	 * 
	 * This instruction stores the contents of register Rr on the STACK. 
	 * The Stack Pointer is post-decremented by 1 after the PUSH.
	 *
	 * @param _Rr
	 */
	push: function(_Rr) {

		/* STACK <- Rr */
		this.stack[this.SP] = this.reg[_Rr];

		this.SP--;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	rcall: function() {

		/* @TODO */



		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	ret: function() {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	reti: function() {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * RJMP – Relative Jump 
	 * 
	 * Relative jump to an address within PC - 2K +1 and PC + 2K (words).
	 * For AVR microcontrollers with Program memory not exceeding 4K words (8K bytes) this instruction can address 
	 * the entire memory from every address location. See also JMP.
	 * 
	 * @param k    -2K <= k <= 2K
	 */
	rjmp: function(k) {

		/* Program Counter: PC ← PC + k + 1 */
		this.PC += k + 1;
	},
	/**
	 * ROL – Rotate Left trough Carry
	 * 
	 * Shifts all bits in Rd one place to the left. 
	 * The C Flag is shifted into bit 0 of Rd. 
	 * Bit 7 is shifted into the C Flag. 
	 * This operation, combined with LSL, effectively multiplies multi-byte signed and unsigned values by two.
	 * 
	 * @param _Rd
	 */
	rol: function(_Rd) {

		var Rd = this.reg[_Rd];

		/* Rd3 */
		this.sreg[5] = Rd[3];
		/* Set if, before the shift, the MSB of Rd was set; cleared otherwise. */
		this.sreg[0] = Rd[7];

		/* Operation: C <- b7 <- ... <- b0 <- C */
		Rd[7] = Rd[6];
		Rd[6] = Rd[5];
		Rd[5] = Rd[4];
		Rd[4] = Rd[3];
		Rd[3] = Rd[2];
		Rd[2] = Rd[1];
		Rd[1] = Rd[0];
		Rd[0] = this.sreg[0];

		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* N ^ C (For N and C after the shift) */
		this.sreg[3] = !!(this.sreg[2] ^ this.sreg[0]);
		/* N ^ V, For signed tests. */
		this.sreg[4] = !!(this.sreg[2] ^ this.sreg[3]);
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[0] && !Rd[1] && !Rd[2] && !Rd[3] && !Rd[4] && !Rd[5] && !Rd[6] && !Rd[7];

		/* Program counter: PC <- PC + 1 */
		this.PC++;

		/* Save changes */
		this.reg[_Rd] = Rd;
	},
	/**
	 * ROR – Rotate Right through Carry
	 * 
	 * Shifts all bits in Rd one place to the right. 
	 * The C Flag is shifted into bit 7 of Rd.
	 * Bit 0 is shifted into the C Flag. 
	 * This operation, combined with ASR, effectively divides multi-byte signed values by two. 
	 * Combined with LSR it effectively divides multibyte unsigned values by two. 
	 * The Carry Flag can be used to round the result.
	 * 
	 * @param _Rd
	 */
	ror: function(_Rd) {

		var Rd = this.reg[_Rd];

		/* Rd3 */
		this.sreg[5] = Rd[3];
		/* Set if, before the shift, the MSB of Rd was set; cleared otherwise. */
		this.sreg[0] = Rd[0];

		Rd[0] = Rd[1];
		Rd[1] = Rd[2];
		Rd[2] = Rd[3];
		Rd[3] = Rd[4];
		Rd[4] = Rd[5];
		Rd[5] = Rd[6];
		Rd[6] = Rd[7];
		Rd[7] = this.sreg[0];

		/* Set if MSB of the result is set; cleared otherwise. */
		this.sreg[2] = Rd[7];
		/* N ^ C (For N and C after the shift) */
		this.sreg[3] = !!(this.sreg[2] ^ this.sreg[0]);
		/* N ^ V, For signed tests. */
		this.sreg[4] = !!(this.sreg[2] ^ this.sreg[3]);
		/* Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[0] && !Rd[1] && !Rd[2] && !Rd[3] && !Rd[4] && !Rd[5] && !Rd[6] && !Rd[7];

		/* Program counter: PC <- PC + 1 */
		this.PC++;

		/* Save changes */
		this.reg[_Rd] = Rd;
	},
	/**
	 * SBC – Subtract with Carry
	 * 
	 * Subtracts two registers and subtracts with the C Flag and places the result in the destination register Rd.
	 * 
	 * @param _Rd
	 * @param _Rr
	 */
	sbc: function(_Rd, _Rr) {

		/* Operation: Rd <- Rd - Rr - C */

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SBCI – Subtract Immediate with Carry
	 * 
	 * Subtracts a constant from a register and subtracts with the C Flag 
	 * and places the result in the destination register Rd.
	 * 
	 * @param _Rd    16 <= d <= 31
	 * @param K       0 <= K <= 255
	 */
	sbci: function(_Rd, K) {

		/* Operation: Rd <- Rd - K - C */

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SBI – Set Bit in I/O Register
	 * 
	 * Sets a specified bit in an I/O Register. 
	 * This instruction operates on the lower 32 I/O Registers – addresses 0-31
	 * 
	 * @param A    0 <= A <= 31
	 * @param b    0 <= b <= 7
	 */
	sbi: function(A, b) {

		/* Operation: I/O(A,b) <- 1 */
		this.io[A][b] = true;

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SBIC – Skip if Bit in I/O Register is Cleared
	 * 
	 * This instruction tests a single bit in an I/O Register and skips the next instruction if the bit is cleared. 
	 * This instruction operates on the lower 32 I/O Registers – addresses 0-31.
	 * 
	 * @param A    0 <= A <= 31
	 * @param b    0 <= b <= 7
	 */
	sbic: function(A, b) {

		/* Operation: If I/O(A,b) = 0 then PC <- PC + 2 (or 3) else PC <- PC + 1  */
		if (this.io[A][b] === false) {
			/* Program Counter: PC <- PC + 2, Skip a one word instruction */
			this.PC += 2;
		}
		else {
			/* Program Counter: PC <- PC + 1, Condition false - no skip */
			this.PC++;
		}
	},
	/**
	 * SBIS – Skip if Bit in I/O Register is Set
	 * 
	 * This instruction tests a single bit in an I/O Register and skips the next instruction if the bit is set. 
	 * This instruction operates on the lower 32 I/O Registers – addresses 0-31.
	 * 
	 * @param A    0 <= A <= 31
	 * @param b    0 <= b <= 7
	 */
	sbis: function(A, b) {

		/* Operation: If I/O(A,b) = 1 then PC <- PC + 2 (or 3) else PC <- PC + 1  */
		if (this.io[A][b] === true) {
			/* Program Counter: PC <- PC + 2, Skip a one word instruction */
			this.PC += 2;
		}
		else {
			/* Program Counter: PC <- PC + 1, Condition false - no skip */
			this.PC++;
		}
	},
	/**
	 * SBIW - SBIW – Subtract Immediate from Word
	 * 
	 * Subtracts an immediate value (0-63) from a register pair and places the result in the register pair.
	 * This instruction operates on the upper four register pairs, 
	 * and is well suited for operations on the Pointer Registers. 
	 * This instruction is not available in all devices. 
	 * Refer to the device specific instruction set summary.
	 * 
	 * @param _Rd    Rd e {24,26,28,30}
	 * @param K      0 <= K <= 63
	 */
	sbiw: function(_Rd, K) {

		/* @TODO */

	},
	/**
	 * SBR - Set Bits in Register
	 * 
	 * Sets specified bits in register Rd.
	 * Performs the logical ORI between the contents of register Rd and a constant mask K 
	 * and places the result in the destination register Rd.
	 * 
	 * @param {type} _Rd
	 * @param {type} K
	 */
	sbr: function(_Rd, K) {

		var Rd = this.reg[_Rd];

		/* Operation: Rd <- Rd v K */
		Rd[0] = Rd[0] || K[0];
		Rd[1] = Rd[1] || K[1];
		Rd[2] = Rd[2] || K[2];
		Rd[3] = Rd[3] || K[3];
		Rd[4] = Rd[4] || K[4];
		Rd[5] = Rd[5] || K[5];
		Rd[6] = Rd[6] || K[6];
		Rd[7] = Rd[7] || K[7];

		/* Z: Set if the result is $00; cleared othervise. */
		this.reg[1] = !Rd[7] && !Rd[6] && !Rd[5] && !Rd[4] && !Rd[3] && !Rd[2] && !Rd[1] && !Rd[0];
		/* N: Set if MSB of the result is set; cleared othervise. */
		this.reg[2] = Rd[7];
		/* V: Cleared */
		this.reg[3] = false;
		/* S: N ^ V, For signed tests. */
		this.reg[4] = !!(this.reg[2] ^ this.reg[3]);

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * SBRC – Skip if Bit in Register is Cleared
	 * 
	 * This instruction tests a single bit in a register and skips the next instruction if the bit is cleared.
	 * 
	 * @param _Rr
	 * @param b
	 */
	sbrc: function(_Rr, b) {

		/* Operation: If Rr(b) = 0 then PC <- PC + 2 (or 3) else PC <- PC + 1 */
		if (this.reg[_Rr][b] === false) {
			/* Program Counter: PC <- PC + 2, Skip a one word instruction */
			this.PC += 2;
		} else {
			/* Program Counter: PC <- PC + 1, Condition false - no skip */
			this.PC++;
		}
	},
	/**
	 * SBRS – Skip if Bit in Register is Set
	 * 
	 * This instruction tests a single bit in a register and skips the next instruction if the bit is set.
	 * 
	 * @param _Rr
	 * @param b
	 */
	sbrs: function(_Rr, b) {

		/* Operation: If Rr(b) = 1 then PC <- PC + 2 (or 3) else PC <- PC + 1 */
		if (this.reg[_Rr][b] === true) {
			/* Program Counter: PC <- PC + 2, Skip a one word instruction */
			this.PC += 2;
		} else {
			/* Program Counter: PC <- PC + 1, Condition false - no skip */
			this.PC++;
		}
	},
	/**
	 * SEC – Set Carry Flag
	 * 
	 * Sets the Carry Flag (C) in SREG (Status Register).
	 */
	sec: function() {

		/* Operation: C <- 1 */
		this.sreg[0] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SEH – Set Half Carry Flag 
	 * 
	 * Sets the Half Carry (H) in SREG (Status Register).
	 */
	seh: function() {

		/* Operation: H <- 1 */
		this.sreg[5] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SEI – Set Global Interrupt Flag
	 * 
	 * Sets the Global Interrupt Flag (I) in SREG (Status Register). 
	 * The instruction following SEI will be executed before any pending interrupts.
	 */
	sei: function() {

		/* Operation: I <- 1 */
		this.sreg[7] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SEN – Set Negative Flag
	 * 
	 * Sets the Negative Flag (N) in SREG (Status Register).
	 */
	sen: function() {

		/* Operation: N <- 1 */
		this.sreg[2] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SER – Set all Bits in Register
	 * 
	 * Loads $FF directly to register Rd.
	 * 
	 * @param _Rd
	 */
	ser: function(_Rd) {

		var Rd = this.reg[_Rd];

		/* Operation: Rd <- $FF */
		Rd[0] = true;
		Rd[1] = true;
		Rd[2] = true;
		Rd[3] = true;
		Rd[4] = true;
		Rd[5] = true;
		Rd[6] = true;
		Rd[7] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * SES – Set Signed Flag
	 * 
	 * Sets the Signed Flag (S) in SREG (Status Register).
	 */
	ses: function() {

		/* Operation: S <- 1 */
		this.sreg[4] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SET – Set T Flag
	 * 
	 * Sets the T Flag in SREG (Status Register)
	 */
	set: function() {

		/* Operation: T <- 1 */
		this.sreg[6] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SEV – Set Overflow Flag
	 * 
	 * Sets the Overflow Flag (V) in SREG (Status Register).
	 */
	sev: function() {

		/* Operation: V <- 1 */
		this.sreg[3] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SEZ – Set Zero Flag
	 * 
	 * Sets the Zero Flag (Z) in SREG (Status Register).
	 */
	sez: function() {

		/* Operation: Z <- 1 */
		this.sreg[1] = true;

		/* Program counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SLEEP
	 * 
	 * This instruction sets the circuit in sleep mode defined by the MCU Control Register
	 */
	sleep: function() {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SPM – Store Program Memory
	 * 
	 */
	spm: function() {
		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * ST (STD) – Store Indirect From Register to Data Space using Index Z
	 * 
	 */
	st: function() {
		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * STS – Store Direct to Data Space
	 * 
	 * Stores one byte from a Register to the data space. 
	 * For parts with SRAM, the data space consists of the Register File, I/O memory and internal SRAM 
	 * (and external SRAM if applicable).
	 * For parts without SRAM, the data space consists of the Register File only. 
	 * The EEPROM has a separate address space.
	 * 
	 * A 16-bit address must be supplied. 
	 * Memory access is limited to the current data segment of 64K bytes. 
	 * The STS instruction uses the RAMPD Register to access memory above 64K bytes. 
	 * To access another data segment in devices with more than 64K bytes data space,
	 * the RAMPD in register in the I/O area has to be changed.
	 * 
	 * This instruction is not available in all devices. Refer to the device specific instruction set summary
	 * 
	 * @param k      0 <= k <= 65535
	 * @param _Rr    16 <= r <= 31
	 */
	sts: function(k, _Rr) {

		this.memory[k] = this.reg[_Rr];

		/* @TODO */

		/* Program Counter: PC <- PC + 2 */
		this.PC += 2;
	},
	/**
	 * SUB – Subtract without Carry
	 * 
	 * Subtracts two registers and places the result in the destination register Rd
	 * 
	 * @param _Rd
	 * @param _Rr
	 */
	sub: function(_Rd, _Rr) {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SUBI – Subtract Immediate
	 * 
	 * Subtracts a register and a constant and places the result in the destination register Rd. 
	 * This instruction is working on Register R16 to R31 
	 * and is very well suited for operations on the X, Y and Z-pointers
	 * 
	 * @param _Rd
	 * @param K
	 */
	subi: function(_Rd, K) {

		/* @TODO */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	},
	/**
	 * SWAP – Swap Nibbles
	 * 
	 * Swaps high and low nibbles in a register
	 * 
	 * @param _Rd
	 */
	swap: function(_Rd) {

		var Rd = this.reg[_Rd];
		var R = [false, false, false, false, false, false, false, false];

		/* Operation: R(7:4) <- Rd(3:0), R(3:0) <- Rd(7:4) */
		R[7] = Rd[3];
		R[6] = Rd[2];
		R[5] = Rd[1];
		R[4] = Rd[0];

		R[3] = Rd[7];
		R[2] = Rd[6];
		R[1] = Rd[5];
		R[0] = Rd[4];

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = R;
	},
	/**
	 * TST - Test for Zero or Minus
	 * 
	 * Tests if a register is zero or negative. 
	 * Performs a logical AND between a register and itself. 
	 * The register will remain unchanged.
	 * 
	 * @param _Rd
	 */
	tst: function(_Rd) {

		var Rd = this.reg[_Rd];

		/* Operation: Rd <- Rd && Rd */
		Rd[0] = Rd[0] && Rd[0];
		Rd[1] = Rd[1] && Rd[1];
		Rd[2] = Rd[2] && Rd[2];
		Rd[3] = Rd[3] && Rd[3];
		Rd[4] = Rd[4] && Rd[4];
		Rd[5] = Rd[5] && Rd[5];
		Rd[6] = Rd[6] && Rd[6];
		Rd[7] = Rd[7] && Rd[7];

		/* Z: Set if the result is $00; cleared otherwise. */
		this.sreg[1] = !Rd[0] && !Rd[1] && !Rd[2] && !Rd[3] && !Rd[4] && !Rd[5] && !Rd[6] && !Rd[7];
		/* N: Set if MSB of the result is set; cleared otherwis. */
		this.sreg[2] = Rd[7];
		/* V: Cleared */
		this.sreg[3] = false;
		/* S: N ^ V, For signed tests. */
		this.sreg[4] = !!(this.sreg[2] ^ this.sreg[3]);

		/* Program Counter: PC <- PC + 1 */
		this.PC++;

		this.reg[_Rd] = Rd;
	},
	/**
	 * This instruction resets the Watchdog Timer. 
	 * This instruction must be executed within a limited time given by the WD prescaler. 
	 * See the Watchdog Timer hardware specification.
	 */
	wd: function() {
		/* @TODO */

		/* Operation: WD timer restart. */

		/* Program Counter: PC <- PC + 1 */
		this.PC++;
	}
};
